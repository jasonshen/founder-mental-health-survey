/**
 * Build the public aggregates JSON that powers the /results/2026 page.
 *
 * Usage:
 *   npx tsx scripts/build-results-aggregates.ts <exports-dir> [out.json]
 *
 * Reads the gitignored flat export (flat-responses.csv + codebook.csv,
 * produced by export-flat-csv.ts) and emits ONLY aggregate counts —
 * never row-level data — to:
 *
 *   app/results/2026/aggregates.json   (default; safe to commit)
 *
 * The flat CSV encodes single_select / dropdown answers as the 0-based
 * index into the question's options; the codebook maps those indices back
 * to human labels. We re-join them here so the page ships with readable
 * category labels and percentages and nothing that could re-identify a
 * respondent.
 *
 * Add a question id to DEMOGRAPHICS / COMPANY below to surface it on the
 * page. Numeric questions (e.g. company_age) are summarized as stats +
 * buckets; everything else is a category distribution in option order.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

// --- minimal RFC4180 CSV parser (codebook labels contain commas/quotes) ---
function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (q) {
      if (c === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; }
        else q = false;
      } else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((r) => Object.fromEntries(headers.map((h, j) => [h, r[j] ?? ""])));
}

// Questions to surface, grouped into page sections. Order here = display order.
const DEMOGRAPHICS = ["company_role", "company_age", "company_gender", "company_ethnicity"];
const COMPANY = ["company_industry", "company_team_size", "company_funding", "company_revenue", "company_year_founded"];

const AGE_MIN = 18;
const AGE_MAX = 80;
const AGE_BUCKETS: Array<[string, (n: number) => boolean]> = [
  ["Under 25", (n) => n < 25],
  ["25–29", (n) => n >= 25 && n < 30],
  ["30–34", (n) => n >= 30 && n < 35],
  ["35–39", (n) => n >= 35 && n < 40],
  ["40–49", (n) => n >= 40 && n < 50],
  ["50+", (n) => n >= 50],
];

interface CategoryOption { label: string; count: number; pct: number; }
interface QuestionAgg {
  id: string;
  text: string;
  kind: "categorical" | "numeric";
  answered: number;
  options?: CategoryOption[];
  stats?: { median: number; mean: number; min: number; max: number };
  buckets?: CategoryOption[];
}

function main() {
  const [dirArg, outArg] = process.argv.slice(2);
  if (!dirArg) {
    console.error("Usage: tsx scripts/build-results-aggregates.ts <exports-dir> [out.json]");
    process.exit(1);
  }
  const dir = resolve(dirArg);
  const outPath = resolve(outArg ?? "app/results/2026/aggregates.json");

  const flat = parseCsv(readFileSync(join(dir, "flat-responses.csv"), "utf8"));
  const codebook = parseCsv(readFileSync(join(dir, "codebook.csv"), "utf8"));

  // codebook → label maps & question text, in option (value) order
  const labelMap = new Map<string, Map<string, string>>();
  const orderMap = new Map<string, string[]>(); // column -> ordered value codes
  const textMap = new Map<string, string>();
  const typeMap = new Map<string, string>();
  for (const r of codebook) {
    const col = r.column;
    if (!labelMap.has(col)) { labelMap.set(col, new Map()); orderMap.set(col, []); }
    if (r.value !== "" && !labelMap.get(col)!.has(r.value)) {
      labelMap.get(col)!.set(r.value, r.label);
      orderMap.get(col)!.push(r.value);
    }
    if (!textMap.has(col)) { textMap.set(col, r.question_text); typeMap.set(col, r.type); }
  }

  const pct = (count: number, base: number) => base ? Math.round((count / base) * 1000) / 10 : 0;

  function categorical(id: string): QuestionAgg {
    const counts = new Map<string, number>();
    let answered = 0;
    for (const row of flat) {
      const v = row[id];
      if (v === undefined || v === "") continue;
      answered++;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    const order = orderMap.get(id) ?? [...counts.keys()];
    const options: CategoryOption[] = [];
    for (const code of order) {
      const c = counts.get(code) ?? 0;
      if (c === 0) continue; // omit empty categories
      options.push({ label: labelMap.get(id)?.get(code) ?? code, count: c, pct: pct(c, answered) });
    }
    return { id, text: textMap.get(id) ?? id, kind: "categorical", answered, options };
  }

  function numericAge(id: string): QuestionAgg {
    const vals: number[] = [];
    for (const row of flat) {
      const raw = row[id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= AGE_MIN && n <= AGE_MAX) vals.push(n);
    }
    vals.sort((a, b) => a - b);
    const answered = vals.length;
    const median = answered ? (answered % 2 ? vals[(answered - 1) / 2] : (vals[answered / 2 - 1] + vals[answered / 2]) / 2) : 0;
    const mean = answered ? Math.round((vals.reduce((s, x) => s + x, 0) / answered) * 10) / 10 : 0;
    const buckets: CategoryOption[] = AGE_BUCKETS.map(([label, fn]) => {
      const c = vals.filter(fn).length;
      return { label, count: c, pct: pct(c, answered) };
    }).filter((b) => b.count > 0);
    return {
      id, text: textMap.get(id) ?? id, kind: "numeric", answered,
      stats: { median, mean, min: vals[0] ?? 0, max: vals[answered - 1] ?? 0 },
      buckets,
    };
  }

  const build = (id: string) => (typeMap.get(id) === "number" ? numericAge(id) : categorical(id));

  // Cohort (YC vs non-YC) — top-level string column, not an indexed select.
  let yc = 0, general = 0;
  for (const row of flat) {
    if (row.cohort === "yc") yc++;
    else if (row.cohort === "general") general++;
  }
  const completed = flat.filter((r) => r.completed === "1").length;

  const out = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: dirArg,
    note: "Aggregate counts only. No row-level or free-text data is included.",
    totals: { responses: flat.length, completed, yc, general },
    cohort: {
      id: "cohort",
      text: "Which founder community are you part of?",
      kind: "categorical" as const,
      answered: yc + general,
      options: [
        { label: "Y Combinator", count: yc, pct: pct(yc, yc + general) },
        { label: "General / non-YC", count: general, pct: pct(general, yc + general) },
      ],
    },
    sections: {
      demographics: { title: "Demographics", questions: DEMOGRAPHICS.map(build) },
      company: { title: "Their companies", questions: COMPANY.map(build) },
    },
  };

  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
  console.log(`  responses=${out.totals.responses} completed=${completed} yc=${yc} general=${general}`);
  for (const s of Object.values(out.sections)) {
    for (const q of s.questions) {
      console.log(`  [${s.title}] ${q.id}: answered=${q.answered}` +
        (q.kind === "numeric" ? ` median=${q.stats!.median} mean=${q.stats!.mean}` : ` cats=${q.options!.length}`));
    }
  }
}

main();
