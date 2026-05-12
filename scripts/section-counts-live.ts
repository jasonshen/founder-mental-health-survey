/**
 * Live per-section response counts straight from Supabase.
 *
 * Usage:
 *   npx tsx scripts/section-counts-live.ts
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local
 * and prints the same table as scripts/section-counts.ts — without needing
 * a CSV export first.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import {
  COMPARISON_THRESHOLD,
  STATS_SELECT_COLUMNS,
  computeStats,
  type SurveyRow,
} from "../lib/aggregates";

function loadEnvLocal(): void {
  const path = resolve(".env.local");
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf-8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing Supabase env vars. Expected NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }
  const supabase = createClient(url, key);

  // Pull every row with the section columns + completed flag + cohort.
  // Pagination guard: ask for up to 10,000 rows. At current scale (~150) this
  // is one round trip; if we ever cross that we'll page properly.
  const { data, error } = await supabase
    .from("survey_responses")
    .select(STATS_SELECT_COLUMNS)
    .range(0, 9999);

  if (error) {
    console.error("Supabase query failed:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as unknown as SurveyRow[];
  const stats = computeStats(rows);

  console.log(`Pulled ${stats.total_rows} rows from survey_responses`);
  console.log(`Completed (completed=true): ${stats.total_completed}`);
  console.log(`Threshold for comparison: ${COMPARISON_THRESHOLD}`);
  console.log(`Generated at: ${stats.generated_at}\n`);

  console.log(
    "section_id                  | total | done | partial | status"
  );
  console.log(
    "----------------------------|-------|------|---------|-------"
  );
  for (const s of stats.by_section) {
    const status = s.ready ? "READY ✅" : `${s.needed} more`;
    console.log(
      `${s.section_id.padEnd(27)} | ${String(s.n_total).padStart(5)} | ${String(
        s.n_completed
      ).padStart(4)} | ${String(s.n_partials).padStart(7)} | ${status}`
    );
  }

  const ready = stats.by_section.filter((s) => s.ready);
  const collecting = stats.by_section.filter((s) => !s.ready);
  console.log(
    `\n${ready.length}/${stats.by_section.length} sections ready for comparison`
  );
  if (collecting.length > 0) {
    const closest = [...collecting].sort((a, b) => a.needed - b.needed)[0];
    console.log(
      `Next to unlock: ${closest.section_id} (${closest.needed} more responses)`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
