import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { isFlagEnabled, FLAG_KEYS } from "@/lib/flags";
import { TokenParamSchema } from "@/lib/schemas";
import { log, tokenPrefix } from "@/lib/log";
import type { AllScores } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Returns empirical percentile ranks for the caller's scores, vs. all other
 * founder submissions. Only responds if the `founder_cohort_percentiles` flag
 * is on — otherwise 404 (so clients know not to show the card).
 *
 * Usage:  GET /api/cohort?token=FMH-XXXX
 */
export async function GET(request: Request) {
  const enabled = await isFlagEnabled(FLAG_KEYS.founderCohortPercentiles);
  if (!enabled) {
    return NextResponse.json({ error: "Flag off" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token") ?? "";
  const parsed = TokenParamSchema.safeParse(rawToken);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  const token = parsed.data.toUpperCase();

  const supabase = createServerClient();

  // Fetch this user's scores.
  const { data: mine, error: mineErr } = await supabase
    .from("survey_responses")
    .select("scores")
    .eq("anonymous_token", token)
    .maybeSingle();

  if (mineErr || !mine?.scores) {
    log.warn("cohort_no_scores_for_token", { token: tokenPrefix(token) });
    return NextResponse.json(
      { error: "Scores not found for this token" },
      { status: 404 }
    );
  }

  const myScores = mine.scores as AllScores;

  // Fetch all completed submissions' scores.
  const { data: all, error: allErr } = await supabase
    .from("survey_responses")
    .select("scores")
    .eq("completed", true)
    .not("scores", "is", null);

  if (allErr) {
    log.error("cohort_db_error", { code: allErr.code });
    return NextResponse.json({ error: "DB error" }, { status: 503 });
  }

  const cohort = (all ?? [])
    .map((r) => r.scores as AllScores | null)
    .filter((s): s is AllScores => s !== null);

  const N = cohort.length;
  if (N < 2) {
    return NextResponse.json(
      { error: "Not enough cohort data yet" },
      { status: 404 }
    );
  }

  // Percentile rank = % of cohort scoring <= my score.
  // Using the "lower-or-equal" convention; excludes only strictly greater.
  function percentile(values: number[], mine: number): number {
    const atOrBelow = values.filter((v) => v <= mine).length;
    return Math.round((atOrBelow / values.length) * 100);
  }

  const phq9Scores = cohort.map((s) => s.phq9.score);
  const gad7Scores = cohort.map((s) => s.gad7.score);
  const asrsFlagged = cohort.map((s) => s.asrs.items_flagged);

  log.info("cohort_computed", { token: tokenPrefix(token), N });

  return NextResponse.json({
    N,
    phq9: {
      percentile: percentile(phq9Scores, myScores.phq9.score),
      mean: Math.round((phq9Scores.reduce((a, b) => a + b, 0) / N) * 10) / 10,
    },
    gad7: {
      percentile: percentile(gad7Scores, myScores.gad7.score),
      mean: Math.round((gad7Scores.reduce((a, b) => a + b, 0) / N) * 10) / 10,
    },
    asrs: {
      percentile: percentile(asrsFlagged, myScores.asrs.items_flagged),
      above_threshold_pct: Math.round(
        (cohort.filter((s) => s.asrs.above_threshold).length / N) * 100
      ),
    },
  });
}
