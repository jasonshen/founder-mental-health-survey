import { SECTION_COLUMN } from "./types";
import type { SectionId } from "./types";
import { SECTION_ORDER } from "./questions";

export const COMPARISON_THRESHOLD = 100;

// Mirrors the four challenge themes rendered in components/ResultsDisplay.tsx.
// Kept here (rather than imported) so this module stays server-friendly and
// dependency-free. If the groupings change there, change them here too.
export const FC_CHALLENGE_VALUE_MAP: Record<string, number> = {
  "Not a challenge for me": 5,
  "Minor challenge": 4,
  "Moderate challenge": 3,
  "Significant challenge": 2,
  "Major challenge": 1,
};

export const FC_GROUPS: Array<{ id: string; items: string[] }> = [
  {
    id: "self_leadership",
    items: ["fc_own_way", "fc_ic_to_leader", "fc_operational_trap", "fc_fraud"],
  },
  {
    id: "team_execution",
    items: ["fc_accountability", "fc_hard_conversations", "fc_team_slow"],
  },
  {
    id: "relationships",
    items: ["fc_cofounder_friction", "fc_board_conflict"],
  },
  {
    id: "business",
    items: [
      "fc_runway_worry",
      "fc_next_round",
      "fc_pivot",
      "fc_growth",
      "fc_competition",
    ],
  },
];

export type SectionDistributions =
  | {
      type: "fc_groups";
      groups: Array<{
        id: string;
        n: number;
        median: number;
        p25: number;
        p75: number;
        /** Raw cohort group-means, used for empirical percentile rank. */
        values: number[];
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

/**
 * Compute the four founder-challenge group means for a single response.
 * Returns one mean per group (null if no items in that group were answered).
 * Values are mapped from string labels via FC_CHALLENGE_VALUE_MAP (1-5,
 * reverse-coded so higher = doing better).
 */
export function fcGroupMeansForRow(
  fcCell: unknown
): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  if (!fcCell || typeof fcCell !== "object" || Array.isArray(fcCell)) {
    for (const g of FC_GROUPS) result[g.id] = null;
    return result;
  }
  const cell = fcCell as Record<string, unknown>;
  for (const g of FC_GROUPS) {
    let sum = 0;
    let count = 0;
    for (const id of g.items) {
      const raw = cell[id];
      if (raw === undefined || raw === null || raw === "") continue;
      const n =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? FC_CHALLENGE_VALUE_MAP[raw]
            : Number(raw);
      if (!Number.isFinite(n)) continue;
      sum += n as number;
      count++;
    }
    result[g.id] = count > 0 ? sum / count : null;
  }
  return result;
}

function fcGroupDistributions(
  rows: SurveyRow[]
): Extract<SectionDistributions, { type: "fc_groups" }>["groups"] {
  const buckets: Record<string, number[]> = {};
  for (const g of FC_GROUPS) buckets[g.id] = [];
  for (const r of rows) {
    const cell = r[SECTION_COLUMN.founder_challenges];
    if (!hasContent(cell)) continue;
    const means = fcGroupMeansForRow(cell);
    for (const g of FC_GROUPS) {
      const v = means[g.id];
      if (v !== null && Number.isFinite(v)) buckets[g.id].push(v);
    }
  }
  return FC_GROUPS.map((g) => {
    const values = buckets[g.id];
    const sorted = [...values].sort((a, b) => a - b);
    return {
      id: g.id,
      n: values.length,
      median: quantile(sorted, 0.5),
      p25: quantile(sorted, 0.25),
      p75: quantile(sorted, 0.75),
      values,
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
    if (ready && sid === "founder_challenges") {
      distributions = {
        type: "fc_groups",
        groups: fcGroupDistributions(rows),
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
  ...Object.values(SECTION_COLUMN),
].join(", ");
