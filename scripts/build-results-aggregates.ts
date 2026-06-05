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

// ─── Section definitions ─────────────────────────────────────────────
// Order here = display order on the results page.

const DEMOGRAPHICS = ["company_role", "company_age", "company_gender", "company_ethnicity"];
const COMPANY = ["company_industry", "company_team_size", "company_funding", "company_revenue", "company_year_founded"];

const LIFE_OUTLOOK = [
  "life_satisfaction", "life_happy", "life_worthwhile", "life_purpose",
  "life_relationships_satisfying", "life_physical_health", "life_mental_health",
  "life_have_to", "life_alone",
];

const AMBITION_DRIVE = ["amb_ambitious", "amb_strive", "amb_challenging_goals"];
const AMBITION_BREADTH = ["amb_multi_domain", "amb_identity_professional"];
const AMBITION_ASPIRATIONS = ["asp_helping", "asp_self_knowledge", "asp_financial", "asp_admiration"];
const AMBITION_REGULATION = [
  "reg_external_avoid", "reg_external_approach", "reg_introjected",
  "reg_identified", "reg_integrated", "reg_intrinsic", "reg_amotivation",
];

const FOUNDER_CHALLENGES = [
  "fc_own_way", "fc_ic_to_leader", "fc_operational_trap", "fc_fraud",
  "fc_accountability", "fc_hard_conversations", "fc_team_slow",
  "fc_cofounder_friction", "fc_board_conflict",
  "fc_runway_worry", "fc_next_round", "fc_pivot", "fc_growth", "fc_competition",
];

const COFOUNDER_LIKERT = [
  "cf_aligned_vision", "cf_quality_standards", "cf_trust_do", "cf_honest_doubts",
  "cf_work_through", "cf_difficult_topics", "cf_roles", "cf_fair_division",
];
const COFOUNDER_DEMO = ["cf_gender", "cf_role"];

const PHQ9_ITEMS = ["phq9_1","phq9_2","phq9_3","phq9_4","phq9_5","phq9_6","phq9_7","phq9_8","phq9_9"];
const GAD7_ITEMS = ["gad7_1","gad7_2","gad7_3","gad7_4","gad7_5","gad7_6","gad7_7"];
const MBI_EXHAUST = ["mbi_exhaust_1","mbi_exhaust_2","mbi_exhaust_3"];
const MBI_CYNICISM = ["mbi_cynicism_1","mbi_cynicism_2","mbi_cynicism_3"];
const MBI_EFFICACY = ["mbi_efficacy_1","mbi_efficacy_2","mbi_efficacy_3"];
const ASRS_ITEMS = ["asrs_1","asrs_2","asrs_3","asrs_4","asrs_5","asrs_6"];
const AQ_ITEMS = ["aq_1","aq_2","aq_3","aq_4","aq_5","aq_6","aq_7","aq_8","aq_9","aq_10"];
const ND_DIAGNOSIS = ["nd_adhd_diagnosis", "nd_autism_diagnosis", "nd_other_diagnosis"];

const DD_MACH = ["dd_m_1","dd_m_2","dd_m_3","dd_m_4"];
const DD_PSYCH = ["dd_p_1","dd_p_2","dd_p_3","dd_p_4"];
const DD_NARC = ["dd_n_1","dd_n_2","dd_n_3","dd_n_4"];

const SOCIAL_SUPPORT = ["ss_could_confide_work","ss_could_confide_personal","ss_confide_work_freq","ss_confide_personal_freq"];

const HELP_SEEKING_CAT = [
  "hs_therapy_ever", "hs_therapy_current", "hs_therapy_duration",
  "hs_coach_ever", "hs_coach_current", "hs_coach_type",
  "hs_considered_no_go", "hs_leave",
];

const SUBSTANCE_ITEMS = [
  "sub_alcohol", "sub_cannabis", "sub_nicotine", "sub_stimulants_no_rx",
  "sub_mdma", "sub_psilocybin", "sub_ayahuasca", "sub_lsd", "sub_ketamine",
];

// ─── Age bucketing ───────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────

interface CategoryOption { label: string; count: number; pct: number; }
interface QuestionAgg {
  id: string;
  text: string;
  kind: "categorical" | "numeric" | "ordinal" | "scale";
  answered: number;
  options?: CategoryOption[];
  stats?: { median: number; mean: number; min: number; max: number; p25: number; p75: number };
  buckets?: CategoryOption[];
}

interface CompositeScore {
  id: string;
  label: string;
  description: string;
  range: [number, number];
  answered: number;
  stats: { median: number; mean: number; p25: number; p75: number; min: number; max: number };
  severity?: CategoryOption[];
}

interface SectionAgg {
  title: string;
  questions: QuestionAgg[];
  composites?: CompositeScore[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

const pct = (count: number, base: number) => base ? Math.round((count / base) * 1000) / 10 : 0;

function computeStats(vals: number[]) {
  if (!vals.length) return { median: 0, mean: 0, min: 0, max: 0, p25: 0, p75: 0 };
  vals.sort((a, b) => a - b);
  const n = vals.length;
  const median = n % 2 ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2;
  const mean = Math.round((vals.reduce((s, x) => s + x, 0) / n) * 10) / 10;
  const p25 = vals[Math.floor(n * 0.25)];
  const p75 = vals[Math.floor(n * 0.75)];
  return { median, mean, min: vals[0], max: vals[n - 1], p25, p75 };
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
  const orderMap = new Map<string, string[]>();
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

  // ─── Aggregation functions ───────────────────────────────────────

  /** Categorical distribution: labels from codebook, option order preserved. */
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
      if (c === 0) continue;
      options.push({ label: labelMap.get(id)?.get(code) ?? code, count: c, pct: pct(c, answered) });
    }
    return { id, text: textMap.get(id) ?? id, kind: "categorical", answered, options };
  }

  /** Numeric (continuous) with age-style bucketing. */
  function numericAge(id: string): QuestionAgg {
    const vals: number[] = [];
    for (const row of flat) {
      const raw = row[id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= AGE_MIN && n <= AGE_MAX) vals.push(n);
    }
    const stats = computeStats(vals);
    const buckets: CategoryOption[] = AGE_BUCKETS.map(([label, fn]) => {
      const c = vals.filter(fn).length;
      return { label, count: c, pct: pct(c, vals.length) };
    }).filter((b) => b.count > 0);
    return { id, text: textMap.get(id) ?? id, kind: "numeric", answered: vals.length, stats, buckets };
  }

  /** Numeric (general — no age clamping, custom bucket fn optional). */
  function numeric(id: string, clampMax?: number): QuestionAgg {
    const vals: number[] = [];
    for (const row of flat) {
      const raw = row[id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) vals.push(clampMax !== undefined ? Math.min(n, clampMax) : n);
    }
    const stats = computeStats(vals);
    return { id, text: textMap.get(id) ?? id, kind: "numeric", answered: vals.length, stats };
  }

  /** 0–10 scale items: raw numeric, with stats. */
  function scale010(id: string): QuestionAgg {
    const vals: number[] = [];
    for (const row of flat) {
      const raw = row[id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n <= 10) vals.push(n);
    }
    const stats = computeStats(vals);
    // Also build a distribution across 0-10
    const dist = new Map<number, number>();
    for (const v of vals) dist.set(v, (dist.get(v) ?? 0) + 1);
    const options: CategoryOption[] = [];
    for (let i = 0; i <= 10; i++) {
      const c = dist.get(i) ?? 0;
      if (c > 0) options.push({ label: String(i), count: c, pct: pct(c, vals.length) });
    }
    return { id, text: textMap.get(id) ?? id, kind: "scale", answered: vals.length, stats, options };
  }

  /** Ordinal Likert (e.g., 0–4 for likert5): distribution + ordinal stats. */
  function ordinal(id: string): QuestionAgg {
    const vals: number[] = [];
    const counts = new Map<string, number>();
    let answered = 0;
    for (const row of flat) {
      const v = row[id];
      if (v === undefined || v === "") continue;
      answered++;
      counts.set(v, (counts.get(v) ?? 0) + 1);
      const n = Number(v);
      if (Number.isFinite(n)) vals.push(n);
    }
    const stats = computeStats(vals);
    const order = orderMap.get(id) ?? [...counts.keys()];
    const options: CategoryOption[] = [];
    for (const code of order) {
      const c = counts.get(code) ?? 0;
      if (c === 0) continue;
      options.push({ label: labelMap.get(id)?.get(code) ?? code, count: c, pct: pct(c, answered) });
    }
    return { id, text: textMap.get(id) ?? id, kind: "ordinal", answered, options, stats };
  }

  /** Multi-select: count how many selected each option. Base = respondents who answered any option. */
  function multiSelect(baseId: string, optionCols: string[]): QuestionAgg[] {
    // Each option column is binary 0/1. Base = rows where any option col is non-empty.
    let base = 0;
    const counts: number[] = optionCols.map(() => 0);
    for (const row of flat) {
      const hasAny = optionCols.some(c => row[c] !== undefined && row[c] !== "");
      if (!hasAny) continue;
      base++;
      for (let i = 0; i < optionCols.length; i++) {
        if (row[optionCols[i]] === "1") counts[i]++;
      }
    }
    const options: CategoryOption[] = optionCols.map((col, i) => {
      // Extract the human label from codebook (the "Selected" label text isn't useful;
      // use the question_text which contains the option name after "option: ")
      const qtext = textMap.get(col) ?? col;
      const match = qtext.match(/option: (.+)$/);
      const label = match ? match[1] : col.replace(`${baseId}__`, "").replace(/_/g, " ");
      return { label, count: counts[i], pct: pct(counts[i], base) };
    });
    return [{
      id: baseId,
      text: textMap.get(optionCols[0])?.replace(/ — option:.*/, "") ?? baseId,
      kind: "categorical",
      answered: base,
      options: options.sort((a, b) => b.count - a.count), // sort by prevalence
    }];
  }

  /** Compute a composite score (sum of items) with severity bands. */
  function compositeSum(
    items: string[],
    label: string,
    description: string,
    maxPerItem: number,
    severityBands?: Array<[string, number, number]>,
  ): CompositeScore {
    const scores: number[] = [];
    for (const row of flat) {
      const vals = items.map(id => row[id]).filter(v => v !== undefined && v !== "");
      if (vals.length < items.length * 0.7) continue; // require 70%+ items answered
      const sum = vals.reduce((s, v) => s + Number(v), 0);
      // Prorate if a few items missing
      const prorated = vals.length < items.length ? Math.round(sum * items.length / vals.length) : sum;
      scores.push(prorated);
    }
    const stats = computeStats(scores);
    const severity = severityBands?.map(([label, lo, hi]) => {
      const c = scores.filter(s => s >= lo && s <= hi).length;
      return { label, count: c, pct: pct(c, scores.length) };
    });
    return {
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label,
      description,
      range: [0, items.length * maxPerItem],
      answered: scores.length,
      stats,
      severity,
    };
  }

  /** Compute a subscale mean (for MBI, Dark Triad). */
  function compositeMean(
    items: string[],
    label: string,
    description: string,
    maxVal: number,
  ): CompositeScore {
    const scores: number[] = [];
    for (const row of flat) {
      const vals = items.map(id => row[id]).filter(v => v !== undefined && v !== "");
      if (vals.length < items.length * 0.7) continue;
      const mean = vals.reduce((s, v) => s + Number(v), 0) / vals.length;
      scores.push(Math.round(mean * 10) / 10);
    }
    const stats = computeStats(scores);
    return {
      id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      label,
      description,
      range: [0, maxVal],
      answered: scores.length,
      stats,
    };
  }

  // ─── Auto-dispatch by type ─────────────────────────────────────────

  const build = (id: string): QuestionAgg => {
    const t = typeMap.get(id);
    if (t === "number" && id === "company_age") return numericAge(id);
    if (t === "number" || t === "number_bounded") return numeric(id, 100);
    if (t === "scale_0_10") return scale010(id);
    if (t?.startsWith("likert") || t === "yes_no") return ordinal(id);
    return categorical(id);
  };

  // ─── Top-level stats ──────────────────────────────────────────────

  let yc = 0, general = 0;
  for (const row of flat) {
    if (row.cohort === "yc") yc++;
    else if (row.cohort === "general") general++;
  }
  const completed = flat.filter((r) => r.completed === "1").length;

  // ─── Build all sections ────────────────────────────────────────────

  // Find multi-select column names from the flat CSV headers
  const flatHeaders = Object.keys(flat[0] ?? {});
  const medCols = flatHeaders.filter(h => h.startsWith("med_current__"));
  const barrierCols = flatHeaders.filter(h => h.startsWith("hs_barriers__"));

  const sections: Record<string, SectionAgg> = {
    demographics: { title: "Demographics", questions: DEMOGRAPHICS.map(build) },
    company: { title: "Their companies", questions: COMPANY.map(build) },

    life_outlook: {
      title: "Life Outlook",
      questions: LIFE_OUTLOOK.map(build),
    },

    founder_challenges: {
      title: "Founder Challenges",
      questions: FOUNDER_CHALLENGES.map(build),
    },

    cofounder: {
      title: "Cofounder Relationship",
      questions: [
        ...COFOUNDER_DEMO.map(build),
        ...COFOUNDER_LIKERT.map(build),
        build("cf_overall_health"),
      ],
    },

    ambition: {
      title: "Ambition & Motivation",
      questions: [
        ...AMBITION_DRIVE.map(build),
        ...AMBITION_BREADTH.map(build),
        ...AMBITION_ASPIRATIONS.map(build),
        ...AMBITION_REGULATION.map(build),
      ],
    },

    depression: {
      title: "Depression (PHQ-9)",
      questions: PHQ9_ITEMS.map(build),
      composites: [
        compositeSum(PHQ9_ITEMS, "PHQ-9 Total", "Sum of 9 items (0–3 each)", 3, [
          ["None (0–4)", 0, 4],
          ["Mild (5–9)", 5, 9],
          ["Moderate (10–14)", 10, 14],
          ["Mod. severe (15–19)", 15, 19],
          ["Severe (20–27)", 20, 27],
        ]),
      ],
    },

    anxiety: {
      title: "Anxiety (GAD-7)",
      questions: GAD7_ITEMS.map(build),
      composites: [
        compositeSum(GAD7_ITEMS, "GAD-7 Total", "Sum of 7 items (0–3 each)", 3, [
          ["Minimal (0–4)", 0, 4],
          ["Mild (5–9)", 5, 9],
          ["Moderate (10–14)", 10, 14],
          ["Severe (15–21)", 15, 21],
        ]),
      ],
    },

    burnout: {
      title: "Burnout (MBI-GS)",
      questions: [...MBI_EXHAUST, ...MBI_CYNICISM, ...MBI_EFFICACY].map(build),
      composites: [
        compositeMean(MBI_EXHAUST, "Exhaustion", "Mean of 3 items (0–6 frequency scale)", 6),
        compositeMean(MBI_CYNICISM, "Cynicism", "Mean of 3 items (0–6 frequency scale)", 6),
        compositeMean(MBI_EFFICACY, "Professional Efficacy", "Mean of 3 items (0–6, higher = more efficacy)", 6),
      ],
    },

    adhd: {
      title: "Focus & Attention (ASRS-6)",
      questions: ASRS_ITEMS.map(build),
      composites: [
        compositeSum(ASRS_ITEMS, "ASRS-6 Total", "Sum of 6 items (0–4 each)", 4, [
          ["Low (0–9)", 0, 9],
          ["Moderate (10–13)", 10, 13],
          ["High (14–24)", 14, 24],
        ]),
      ],
    },

    autism: {
      title: "Perception & Social Processing (AQ-10)",
      questions: [...AQ_ITEMS.map(build), ...ND_DIAGNOSIS.map(build)],
    },

    dark_triad: {
      title: "Personality (Dirty Dozen)",
      questions: [...DD_MACH, ...DD_PSYCH, ...DD_NARC].map(build),
      composites: [
        compositeMean(DD_MACH, "Machiavellianism", "Mean of 4 items (0–4 agree scale)", 4),
        compositeMean(DD_PSYCH, "Psychopathy", "Mean of 4 items (0–4 agree scale)", 4),
        compositeMean(DD_NARC, "Narcissism", "Mean of 4 items (0–4 agree scale)", 4),
      ],
    },

    social_support: {
      title: "Social Support & Connection",
      questions: SOCIAL_SUPPORT.map(id => numeric(id, 50)),
    },

    help_seeking: {
      title: "Help-Seeking & Mental Health Support",
      questions: [
        ...HELP_SEEKING_CAT.map(build),
        build("hs_therapy_impact"),
        build("hs_coach_impact"),
        ...multiSelect("hs_barriers", barrierCols),
      ],
    },

    medication: {
      title: "Medication",
      questions: multiSelect("med_current", medCols),
    },

    substance_use: {
      title: "Substance Use",
      questions: SUBSTANCE_ITEMS.map(build),
    },
  };

  // ─── Output ────────────────────────────────────────────────────────

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
    sections,
  };

  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${outPath}`);
  console.log(`  responses=${out.totals.responses} completed=${completed} yc=${yc} general=${general}`);
  for (const [key, s] of Object.entries(out.sections)) {
    console.log(`  [${s.title}] ${s.questions.length} questions` +
      (s.composites ? `, ${s.composites.length} composites` : ""));
    for (const q of s.questions) {
      console.log(`    ${q.id}: answered=${q.answered}` +
        (q.stats ? ` median=${q.stats.median} mean=${q.stats.mean} p25=${q.stats.p25} p75=${q.stats.p75}` : ` cats=${q.options?.length ?? 0}`));
    }
    if (s.composites) {
      for (const c of s.composites) {
        console.log(`    [composite] ${c.label}: n=${c.answered} median=${c.stats.median} mean=${c.stats.mean} p25=${c.stats.p25} p75=${c.stats.p75}`);
        if (c.severity) {
          for (const sv of c.severity) console.log(`      ${sv.label}: ${sv.count} (${sv.pct}%)`);
        }
      }
    }
  }
}

main();
