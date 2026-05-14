import { SECTION_COLUMN } from "./types";
import type { SectionId } from "./types";
import { SECTION_ORDER } from "./questions";

export const COMPARISON_THRESHOLD = 90;

// Value maps mirror the option arrays in lib/questions.ts. Used to turn
// stored string answers into numeric subscale means at compute time.
export const FC_CHALLENGE_VALUE_MAP: Record<string, number> = {
  "Not a challenge for me": 5,
  "Minor challenge": 4,
  "Moderate challenge": 3,
  "Significant challenge": 2,
  "Major challenge": 1,
};

const AGREE_5_VALUES: Record<string, number> = {
  "Strongly disagree": 1,
  Disagree: 2,
  "Neither agree nor disagree": 3,
  Agree: 4,
  "Strongly agree": 5,
};

const IMPORTANCE_5_VALUES: Record<string, number> = {
  "Not at all important": 1,
  "Slightly important": 2,
  "Moderately important": 3,
  "Very important": 4,
  "Extremely important": 5,
};

const MBI_FREQ_VALUES: Record<string, number> = {
  Never: 0,
  "A few times a year": 1,
  "Once a month or less": 2,
  "A few times a month": 3,
  "Once a week": 4,
  "A few times a week": 5,
  "Every day": 6,
};

/**
 * A subscale is a named comparison row inside a section. There are two
 * sources for its value:
 *   - `items` — mean of a set of question-level answers from the section's
 *     JSON cell (with optional text → number value map).
 *   - `scoreField` — a dot-path read out of the precomputed `scores` JSONB
 *     (e.g. `phq9.score`). Used for screening instruments whose comparison
 *     is on a total score rather than a per-item mean.
 *
 * Exactly one of `items` / `scoreField` must be set per subscale.
 */
export type Subscale = {
  id: string;
  label: string;
  items?: string[];
  scoreField?: string;
  /** Optional text → number map for items-based subscales. */
  valueMap?: Record<string, number>;
  /** Display scale for the bar. */
  min: number;
  max: number;
  /** True when high values indicate a problem — flips comparison language. */
  inverted?: boolean;
};

/**
 * Per-section subscale configs. The mean-of-items pattern is shared across
 * every section here; adding a new section is just adding an entry. Sections
 * without an entry don't get a comparison renderer (demographics, free text,
 * single-item modules, etc.).
 */
export const SECTION_SUBSCALES: Partial<Record<SectionId, Subscale[]>> = {
  founder_challenges: [
    {
      id: "self_leadership",
      label: "Self-Leadership",
      items: ["fc_own_way", "fc_ic_to_leader", "fc_operational_trap", "fc_fraud"],
      valueMap: FC_CHALLENGE_VALUE_MAP,
      min: 1,
      max: 5,
    },
    {
      id: "team_execution",
      label: "Team & Execution",
      items: ["fc_accountability", "fc_hard_conversations", "fc_team_slow"],
      valueMap: FC_CHALLENGE_VALUE_MAP,
      min: 1,
      max: 5,
    },
    {
      id: "relationships",
      label: "Cofounder & Board",
      items: ["fc_cofounder_friction", "fc_board_conflict"],
      valueMap: FC_CHALLENGE_VALUE_MAP,
      min: 1,
      max: 5,
    },
    {
      id: "business",
      label: "Business Risk",
      items: [
        "fc_runway_worry",
        "fc_next_round",
        "fc_pivot",
        "fc_growth",
        "fc_competition",
      ],
      valueMap: FC_CHALLENGE_VALUE_MAP,
      min: 1,
      max: 5,
    },
  ],
  cofounder: [
    {
      id: "overall",
      label: "Overall relationship health",
      items: ["cf_overall_health"],
      min: 0,
      max: 10,
    },
    {
      id: "compatible_vision",
      label: "Compatible Vision",
      items: ["cf_aligned_vision", "cf_quality_standards"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "calibrated_teamwork",
      label: "Calibrated Teamwork",
      items: ["cf_roles", "cf_fair_division"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "productive_conflict",
      label: "Productive Conflict",
      items: ["cf_work_through", "cf_difficult_topics"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "supportive_trust",
      label: "Supportive Trust",
      items: ["cf_trust_do", "cf_honest_doubts"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
  ],
  life_outlook: [
    {
      id: "wellbeing",
      label: "Well-being",
      items: ["life_satisfaction", "life_happy", "life_worthwhile", "life_purpose"],
      min: 0,
      max: 10,
    },
    {
      id: "domains",
      label: "Life domains",
      items: [
        "life_relationships_satisfying",
        "life_physical_health",
        "life_mental_health",
      ],
      min: 0,
      max: 10,
    },
    {
      id: "frustration",
      label: "Need-frustration (founder role)",
      items: ["life_have_to", "life_alone"],
      min: 0,
      max: 10,
      inverted: true,
    },
  ],
  ambition: [
    {
      id: "drive",
      label: "Drive intensity",
      items: ["amb_ambitious", "amb_strive", "amb_challenging_goals"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "autonomous",
      label: "Autonomous regulation",
      items: ["reg_identified", "reg_integrated", "reg_intrinsic"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "controlled",
      label: "Controlled regulation",
      items: ["reg_external_avoid", "reg_external_approach", "reg_introjected"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
      inverted: true,
    },
    {
      id: "intrinsic_asp",
      label: "Intrinsic aspirations",
      items: ["asp_helping", "asp_self_knowledge"],
      valueMap: IMPORTANCE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "extrinsic_asp",
      label: "Extrinsic aspirations",
      items: ["asp_financial", "asp_admiration"],
      valueMap: IMPORTANCE_5_VALUES,
      min: 1,
      max: 5,
    },
  ],
  burnout: [
    {
      id: "exhaustion",
      label: "Emotional exhaustion",
      items: ["mbi_exhaust_1", "mbi_exhaust_2", "mbi_exhaust_3"],
      valueMap: MBI_FREQ_VALUES,
      min: 0,
      max: 6,
      inverted: true,
    },
    {
      id: "cynicism",
      label: "Cynicism",
      items: ["mbi_cynicism_1", "mbi_cynicism_2", "mbi_cynicism_3"],
      valueMap: MBI_FREQ_VALUES,
      min: 0,
      max: 6,
      inverted: true,
    },
    {
      id: "efficacy",
      label: "Professional efficacy",
      items: ["mbi_efficacy_1", "mbi_efficacy_2", "mbi_efficacy_3"],
      valueMap: MBI_FREQ_VALUES,
      min: 0,
      max: 6,
    },
  ],
  dark_triad: [
    {
      id: "mach",
      label: "Machiavellianism",
      items: ["dd_m_1", "dd_m_2", "dd_m_3", "dd_m_4"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "psyc",
      label: "Psychopathy",
      items: ["dd_p_1", "dd_p_2", "dd_p_3", "dd_p_4"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
    {
      id: "narc",
      label: "Narcissism",
      items: ["dd_n_1", "dd_n_2", "dd_n_3", "dd_n_4"],
      valueMap: AGREE_5_VALUES,
      min: 1,
      max: 5,
    },
  ],
  depression: [
    {
      id: "phq9_total",
      label: "PHQ-9 total score",
      scoreField: "phq9.score",
      min: 0,
      max: 27,
      inverted: true,
    },
  ],
  anxiety: [
    {
      id: "gad7_total",
      label: "GAD-7 total score",
      scoreField: "gad7.score",
      min: 0,
      max: 21,
      inverted: true,
    },
  ],
  adhd: [
    {
      id: "asrs_items",
      label: "ASRS items met (of 6)",
      scoreField: "asrs.items_flagged",
      min: 0,
      max: 6,
    },
  ],
  autism: [
    {
      id: "aq10_score",
      label: "AQ-10 score",
      scoreField: "aq10.score",
      min: 0,
      max: 10,
    },
  ],
};

export type SectionDistributions =
  | {
      type: "subscales";
      groups: Array<{
        id: string;
        label: string;
        n: number;
        median: number;
        p25: number;
        p75: number;
        /** Raw cohort subscale means, used for empirical percentile rank. */
        values: number[];
        min: number;
        max: number;
        inverted: boolean;
      }>;
    }
  | { type: "none" };

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export interface SectionCount {
  section_id: SectionId;
  column: string;
  n_total: number;
  n_completed: number;
  n_partials: number;
  ready: boolean;
  needed: number;
  /** Populated only when ready (n_total >= COMPARISON_THRESHOLD). */
  distributions?: SectionDistributions;
}

export interface StatsBundle {
  total_rows: number;
  total_completed: number;
  threshold: number;
  generated_at: string;
  by_section: SectionCount[];
}

export interface SurveyRow {
  completed?: boolean | null;
  cohort?: string | null;
  [key: string]: unknown;
}

function hasContent(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v !== "" && v !== "{}";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return false;
}

function readScoreField(scores: unknown, path: string): number | null {
  if (!scores || typeof scores !== "object") return null;
  let cur: unknown = scores;
  for (const key of path.split(".")) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === "number" && Number.isFinite(cur) ? cur : null;
}

/**
 * Compute one value per subscale for a single response row. Items-based
 * subscales average the answered items from `sectionCell` (with optional
 * value map); score-based subscales read a dot path out of `scoresBlob`.
 * Unanswered groups / missing scores resolve to null.
 */
export function subscaleMeansForRow(
  sectionCell: unknown,
  scoresBlob: unknown,
  subscales: Subscale[]
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  const cell =
    sectionCell && typeof sectionCell === "object" && !Array.isArray(sectionCell)
      ? (sectionCell as Record<string, unknown>)
      : null;
  for (const s of subscales) {
    if (s.scoreField) {
      result[s.id] = readScoreField(scoresBlob, s.scoreField);
      continue;
    }
    if (!cell || !s.items) {
      result[s.id] = null;
      continue;
    }
    let sum = 0;
    let count = 0;
    for (const id of s.items) {
      const raw = cell[id];
      if (raw === undefined || raw === null || raw === "") continue;
      const n =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? s.valueMap
              ? s.valueMap[raw]
              : Number(raw)
            : Number(raw);
      if (!Number.isFinite(n)) continue;
      sum += n as number;
      count++;
    }
    result[s.id] = count > 0 ? sum / count : null;
  }
  return result;
}

function subscaleDistributions(
  rows: SurveyRow[],
  sectionId: SectionId,
  subscales: Subscale[]
): Extract<SectionDistributions, { type: "subscales" }>["groups"] {
  const buckets: Record<string, number[]> = {};
  for (const s of subscales) buckets[s.id] = [];
  const anyItemsBased = subscales.some((s) => s.items && !s.scoreField);
  const allScoreBased = subscales.every((s) => s.scoreField);
  for (const r of rows) {
    const cell = r[SECTION_COLUMN[sectionId]];
    const scoresBlob = (r as Record<string, unknown>).scores;
    // Skip rows that can't contribute to ANY subscale in this section:
    // items-based sections need section content; pure score-based sections
    // need the scores blob to exist.
    if (anyItemsBased && !hasContent(cell)) continue;
    if (allScoreBased && !scoresBlob) continue;
    const means = subscaleMeansForRow(cell, scoresBlob, subscales);
    for (const s of subscales) {
      const v = means[s.id];
      if (v !== null && Number.isFinite(v)) buckets[s.id].push(v);
    }
  }
  return subscales.map((s) => {
    const values = buckets[s.id];
    const sorted = [...values].sort((a, b) => a - b);
    return {
      id: s.id,
      label: s.label,
      n: values.length,
      median: quantile(sorted, 0.5),
      p25: quantile(sorted, 0.25),
      p75: quantile(sorted, 0.75),
      values,
      min: s.min,
      max: s.max,
      inverted: s.inverted === true,
    };
  });
}

export function computeStats(rows: SurveyRow[]): StatsBundle {
  const by_section: SectionCount[] = [];
  for (const sid of SECTION_ORDER) {
    const column = SECTION_COLUMN[sid];
    let n_total = 0;
    let n_completed = 0;
    for (const r of rows) {
      if (!hasContent(r[column])) continue;
      n_total++;
      if (r.completed === true) n_completed++;
    }
    const ready = n_total >= COMPARISON_THRESHOLD;
    let distributions: SectionDistributions | undefined;
    const subscales = SECTION_SUBSCALES[sid];
    if (ready && subscales) {
      distributions = {
        type: "subscales",
        groups: subscaleDistributions(rows, sid, subscales),
      };
    }
    by_section.push({
      section_id: sid,
      column,
      n_total,
      n_completed,
      n_partials: n_total - n_completed,
      ready,
      needed: Math.max(0, COMPARISON_THRESHOLD - n_total),
      ...(distributions ? { distributions } : {}),
    });
  }
  return {
    total_rows: rows.length,
    total_completed: rows.filter((r) => r.completed === true).length,
    threshold: COMPARISON_THRESHOLD,
    generated_at: new Date().toISOString(),
    by_section,
  };
}

/**
 * Percentile rank: % of cohort values ≤ mine.
 * Matches the convention in app/api/cohort/route.ts.
 */
export function percentileRank(values: number[], mine: number): number {
  if (values.length === 0) return 0;
  const atOrBelow = values.filter((v) => v <= mine).length;
  return Math.round((atOrBelow / values.length) * 100);
}

export const STATS_SELECT_COLUMNS = [
  "completed",
  "cohort",
  "scores",
  ...Object.values(SECTION_COLUMN),
].join(", ");
