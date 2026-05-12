/**
 * Pick a random completed survey response and print its results URL.
 *
 * Usage:
 *   npx tsx scripts/random-token.ts
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const path = resolve(".env.local");
  if (existsSync(path)) {
    for (const raw of readFileSync(path, "utf-8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await sb
    .from("survey_responses")
    .select("anonymous_token, cohort, created_at, sections_completed, scores")
    .eq("completed", true)
    .not("anonymous_token", "is", null);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) {
    console.error("No completed responses with tokens");
    process.exit(1);
  }
  const pick = data[Math.floor(Math.random() * data.length)];
  console.log(
    JSON.stringify(
      {
        anonymous_token: pick.anonymous_token,
        cohort: pick.cohort,
        created_at: pick.created_at,
        sections_completed_count: Array.isArray(pick.sections_completed)
          ? pick.sections_completed.length
          : 0,
        has_scores: !!pick.scores,
      },
      null,
      2
    )
  );
  console.log("\nResults URL (local):");
  console.log(`  http://localhost:3000/results?token=${pick.anonymous_token}`);
  console.log(
    `\nFrom a pool of ${data.length} completed responses with tokens.`
  );
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
