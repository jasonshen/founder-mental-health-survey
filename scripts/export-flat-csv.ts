/**
 * Export survey responses to a flat numeric CSV + codebook.
 *
 * Usage:
 *   npx tsx scripts/export-flat-csv.ts <input.csv> <output-dir>
 *
 * Reads a CSV export of the survey_responses table (Postgres-style CSV with
 * JSONB section_* columns) and emits three files into <output-dir>:
 *
 *   flat-responses.csv
 *     Numeric-only. One row per response. Identifier columns first
 *     (response_id, cohort, completed, etc.), then one column per question
 *     from the canonical ALL_QUESTIONS list. Multi-select questions expand
 *     to one binary column per option (named `<id>__<option_slug>`).
 *     Free-text questions are kept out of this file (see -text variant).
 *     Cells are numeric where possible; empty when the respondent didn't
 *     answer.
 *
 *   flat-responses-text.csv
 *     Free-text answers only, joined to flat-responses.csv on response_id.
 *     Kept separate so the numeric file stays purely numeric (and so text
 *     — which carries higher re-identification risk — can be handled under
 *     a stricter access policy).
 *
 *   codebook.csv
 *     Long-format mapping: one row per (column, value) pair, with the
 *     question text and the human-readable label for each numeric code.
 *     This is the answer key analysts use to decode flat-responses.csv.
 *
 * Encoding rules (mirrored in the codebook):
 *   - scale_0_10, number, number_bounded → numeric pass-through
 *   - single_select, dropdown, likert*, yes_no* → 0-based index of the
 *     answer in the question's options array
 *   - multi_select → expanded to one binary (0=not selected / 1=selected)
 *     column per option
 *   - text, text_long → omitted from the flat CSV (logged in codebook)
 *   - missing or unrecognized values → empty cell
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { ALL_QUESTIONS } from "../lib/questions";
import { SECTION_COLUMN } from "../lib/types";
import type { Question } from "../lib/types";

// ---------------------------------------------------------------------------
// CSV parser & writer (RFC 4180-ish — handles quoted fields, doubled quotes,
// embedded newlines/commas. Sufficient for Postgres CSV exports.)
// ---------------------------------------------------------------------------

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuoted = false;
  let i = 0;

  while (i < input.length) {
    const c = input[i];
    if (inQuoted) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuoted = false;
        i++;
        continue;
      }
      cell += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuoted = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(cell);
      cell = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
      i++;
      continue;
    }
    cell += c;
    i++;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j] ?? ""])));
}

function escapeCsvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(
  headers: string[],
  rows: Array<Record<string, unknown>>
): string {
  const lines: string[] = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  }
  return lines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Column spec & encoding
// ---------------------------------------------------------------------------

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

interface FlatColumn {
  name: string;
  questionId: string;
  question: Question;
  /** For multi-select: which option this binary column represents. */
  optionLabel?: string;
}

// Question IDs that duplicate top-level identifier columns. Skipped from
// the flat output to avoid CSV header collisions.
const SKIP_QUESTION_IDS = new Set(["cohort"]);

function buildColumnSpec(): FlatColumn[] {
  const cols: FlatColumn[] = [];
  for (const q of ALL_QUESTIONS) {
    if (SKIP_QUESTION_IDS.has(q.id)) continue;
    if (q.type === "text" || q.type === "text_long") continue;
    if (q.type === "multi_select") {
      if (!q.options) continue;
      // Disambiguate slug collisions within the same question by appending an index.
      const seen = new Map<string, number>();
      for (const opt of q.options) {
        const baseSlug = slugify(opt) || "opt";
        const dup = seen.get(baseSlug) ?? 0;
        seen.set(baseSlug, dup + 1);
        const slug = dup === 0 ? baseSlug : `${baseSlug}_${dup + 1}`;
        cols.push({
          name: `${q.id}__${slug}`,
          questionId: q.id,
          question: q,
          optionLabel: opt,
        });
      }
    } else {
      cols.push({ name: q.id, questionId: q.id, question: q });
    }
  }
  return cols;
}

function encodeValue(q: Question, value: unknown): number | string | null {
  if (value === null || value === undefined || value === "") return null;
  switch (q.type) {
    case "scale_0_10":
    case "number":
    case "number_bounded": {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case "text":
    case "text_long":
    case "multi_select":
      return null;
    default: {
      if (!q.options) return null;
      const s = String(value);
      // Tolerate case-insensitive matches (some legacy data uses "Very often"
      // vs canonical "Very Often", etc.)
      const idx = q.options.findIndex(
        (o) => o === s || o.toLowerCase() === s.toLowerCase()
      );
      return idx >= 0 ? idx : null;
    }
  }
}

// ---------------------------------------------------------------------------
// Per-row processing
// ---------------------------------------------------------------------------

function extractAnswers(
  row: Record<string, string>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {};
  for (const colName of Object.values(SECTION_COLUMN)) {
    const cell = row[colName];
    if (!cell || cell === "" || cell === "{}") continue;
    try {
      const parsed = JSON.parse(cell);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        Object.assign(merged, parsed);
      }
    } catch {
      // Skip malformed JSON cells.
    }
  }
  return merged;
}

function buildFlatRow(
  row: Record<string, string>,
  cols: FlatColumn[]
): {
  flat: Record<string, unknown>;
  unmappedKeys: string[];
} {
  const out: Record<string, unknown> = {
    response_id: row["id"] ?? "",
    anonymous_token: row["anonymous_token"] ?? "",
    cohort: row["cohort"] ?? "",
    completed:
      row["completed"] === "true" ? 1 : row["completed"] === "false" ? 0 : "",
    created_at: row["created_at"] ?? "",
    last_section_completed: row["last_section_completed"] ?? "",
  };

  try {
    const sc = JSON.parse(row["sections_completed"] || "[]");
    out.sections_completed_count = Array.isArray(sc) ? sc.length : "";
  } catch {
    out.sections_completed_count = "";
  }

  const answers = extractAnswers(row);
  const knownIds = new Set(ALL_QUESTIONS.map((q) => q.id));
  const unmappedKeys = Object.keys(answers).filter((k) => !knownIds.has(k));

  for (const col of cols) {
    const raw = answers[col.questionId];
    if (col.optionLabel != null) {
      if (Array.isArray(raw)) {
        out[col.name] = raw.includes(col.optionLabel) ? 1 : 0;
      } else if (raw === undefined) {
        out[col.name] = "";
      } else {
        out[col.name] = "";
      }
    } else {
      const encoded = encodeValue(col.question, raw);
      out[col.name] = encoded === null ? "" : encoded;
    }
  }

  return { flat: out, unmappedKeys };
}

// ---------------------------------------------------------------------------
// Codebook
// ---------------------------------------------------------------------------

interface CodebookRow extends Record<string, unknown> {
  column: string;
  question_id: string;
  question_text: string;
  section: string;
  type: string;
  encoding: string;
  value: string;
  label: string;
}

function buildCodebook(cols: FlatColumn[]): CodebookRow[] {
  const rows: CodebookRow[] = [];

  // Identifier columns
  const meta: Array<[string, string, string]> = [
    ["response_id", "Unique row identifier (UUID)", "string"],
    [
      "anonymous_token",
      "Token shown to respondent (FMH-XXXX); empty for partial rows",
      "string",
    ],
    ["cohort", "Survey cohort", "categorical"],
    ["completed", "Did the respondent finish the survey?", "binary"],
    ["created_at", "Timestamp the response was created", "datetime"],
    [
      "last_section_completed",
      "ID of the last section the respondent completed",
      "string",
    ],
    [
      "sections_completed_count",
      "Number of sections the respondent completed",
      "integer",
    ],
  ];
  for (const [col, desc, type] of meta) {
    rows.push({
      column: col,
      question_id: "",
      question_text: desc,
      section: "_meta",
      type,
      encoding: "—",
      value: "",
      label: "",
    });
  }
  rows.push({
    column: "cohort",
    question_id: "",
    question_text: "Survey cohort",
    section: "_meta",
    type: "categorical",
    encoding: "string",
    value: "yc",
    label: "YC alum (or current batch)",
  });
  rows.push({
    column: "cohort",
    question_id: "",
    question_text: "Survey cohort",
    section: "_meta",
    type: "categorical",
    encoding: "string",
    value: "general",
    label: "General founder (non-YC)",
  });
  rows.push({
    column: "completed",
    question_id: "",
    question_text: "Did the respondent finish the survey?",
    section: "_meta",
    type: "binary",
    encoding: "binary",
    value: "0",
    label: "Partial / abandoned",
  });
  rows.push({
    column: "completed",
    question_id: "",
    question_text: "Did the respondent finish the survey?",
    section: "_meta",
    type: "binary",
    encoding: "binary",
    value: "1",
    label: "Completed",
  });

  for (const col of cols) {
    const q = col.question;

    if (col.optionLabel != null) {
      const text = `${q.text} — option: ${col.optionLabel}`;
      rows.push({
        column: col.name,
        question_id: q.id,
        question_text: text,
        section: q.section,
        type: q.type,
        encoding: "binary",
        value: "0",
        label: "Not selected",
      });
      rows.push({
        column: col.name,
        question_id: q.id,
        question_text: text,
        section: q.section,
        type: q.type,
        encoding: "binary",
        value: "1",
        label: "Selected",
      });
      continue;
    }

    if (
      q.type === "scale_0_10" ||
      q.type === "number" ||
      q.type === "number_bounded"
    ) {
      let range = "numeric";
      if (q.type === "scale_0_10") range = "0–10";
      else if (q.type === "number_bounded" && q.min != null && q.max != null) {
        range = `${q.min}–${q.max}`;
      }
      rows.push({
        column: col.name,
        question_id: q.id,
        question_text: q.text,
        section: q.section,
        type: q.type,
        encoding: range,
        value: range,
        label: q.anchors
          ? `${q.anchors.left} ↔ ${q.anchors.right}`
          : "continuous",
      });
      continue;
    }

    if (q.options) {
      q.options.forEach((opt, idx) => {
        rows.push({
          column: col.name,
          question_id: q.id,
          question_text: q.text,
          section: q.section,
          type: q.type,
          encoding: "0-based index",
          value: String(idx),
          label: opt,
        });
      });
    }
  }

  // Document text questions: emitted to flat-responses-text.csv (a separate
  // file keyed by response_id), not the numeric flat CSV.
  for (const q of ALL_QUESTIONS) {
    if (q.type !== "text" && q.type !== "text_long") continue;
    rows.push({
      column: q.id,
      question_id: q.id,
      question_text: q.text,
      section: q.section,
      type: q.type,
      encoding: "free text — see flat-responses-text.csv",
      value: "",
      label: "",
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Text-only export
// ---------------------------------------------------------------------------

function getTextQuestionIds(): string[] {
  return ALL_QUESTIONS.filter(
    (q) => q.type === "text" || q.type === "text_long"
  ).map((q) => q.id);
}

function buildTextRow(
  row: Record<string, string>,
  textIds: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    response_id: row["id"] ?? "",
    anonymous_token: row["anonymous_token"] ?? "",
    cohort: row["cohort"] ?? "",
    created_at: row["created_at"] ?? "",
  };
  const answers = extractAnswers(row);
  for (const id of textIds) {
    const v = answers[id];
    out[id] = typeof v === "string" ? v : "";
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const [inputArg, outDirArg] = process.argv.slice(2);
  if (!inputArg || !outDirArg) {
    console.error(
      "Usage: tsx scripts/export-flat-csv.ts <input.csv> <output-dir>"
    );
    process.exit(1);
  }

  const inputPath = resolve(inputArg);
  const outDir = resolve(outDirArg);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const csv = readFileSync(inputPath, "utf-8");
  const rows = parseCsv(csv);
  console.log(`Parsed ${rows.length} response rows from ${inputPath}`);

  const cols = buildColumnSpec();
  console.log(
    `Generated ${cols.length} flat columns from ${ALL_QUESTIONS.length} canonical questions`
  );

  const idHeaders = [
    "response_id",
    "anonymous_token",
    "cohort",
    "completed",
    "created_at",
    "last_section_completed",
    "sections_completed_count",
  ];
  const colHeaders = cols.map((c) => c.name);
  const allHeaders = [...idHeaders, ...colHeaders];

  const flatRows: Array<Record<string, unknown>> = [];
  const unmappedHistogram = new Map<string, number>();
  for (const r of rows) {
    const { flat, unmappedKeys } = buildFlatRow(r, cols);
    flatRows.push(flat);
    for (const k of unmappedKeys) {
      unmappedHistogram.set(k, (unmappedHistogram.get(k) ?? 0) + 1);
    }
  }

  writeFileSync(
    join(outDir, "flat-responses.csv"),
    writeCsv(allHeaders, flatRows)
  );

  // Text-only export
  const textIds = getTextQuestionIds();
  const textHeaders = ["response_id", "anonymous_token", "cohort", "created_at", ...textIds];
  const textRows = rows.map((r) => buildTextRow(r, textIds));
  // Drop rows that have no text content at all to keep the file tight.
  const nonEmptyTextRows = textRows.filter((r) =>
    textIds.some((id) => typeof r[id] === "string" && (r[id] as string).length > 0)
  );
  writeFileSync(
    join(outDir, "flat-responses-text.csv"),
    writeCsv(textHeaders, nonEmptyTextRows)
  );

  const codebook = buildCodebook(cols);
  const codebookHeaders = [
    "column",
    "question_id",
    "question_text",
    "section",
    "type",
    "encoding",
    "value",
    "label",
  ];
  writeFileSync(
    join(outDir, "codebook.csv"),
    writeCsv(codebookHeaders, codebook)
  );

  console.log(
    `\nWrote flat-responses.csv:      ${flatRows.length} rows × ${allHeaders.length} columns`
  );
  console.log(
    `Wrote flat-responses-text.csv: ${nonEmptyTextRows.length} rows × ${textHeaders.length} columns (${textIds.length} text fields)`
  );
  console.log(`Wrote codebook.csv:            ${codebook.length} rows`);

  // Density: % of question cells (non-meta) that have a value
  let answered = 0;
  let total = 0;
  for (const fr of flatRows) {
    for (const c of cols) {
      total++;
      const v = fr[c.name];
      if (v !== "" && v !== null && v !== undefined) answered++;
    }
  }
  console.log(
    `Density: ${answered}/${total} answered cells (${(
      (answered / Math.max(total, 1)) *
      100
    ).toFixed(1)}%)`
  );

  if (unmappedHistogram.size > 0) {
    const top = [...unmappedHistogram.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    console.log(
      `\nUnmapped JSONB keys (legacy / unknown question IDs, top 10):`
    );
    for (const [k, n] of top) console.log(`  ${k}: ${n}`);
  }
}

main();
