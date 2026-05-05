import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { TokenParamSchema } from "@/lib/schemas";
import { log, tokenPrefix } from "@/lib/log";
import { scoreAQ10, scoreDarkTriad } from "@/lib/scoring";
import type { AllScores, SurveyResponses } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token: rawToken } = await context.params;

  const tokenParse = TokenParamSchema.safeParse(rawToken);
  if (!tokenParse.success) {
    log.warn("results_invalid_token_format", { token: tokenPrefix(rawToken) });
    return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
  }
  const token = tokenParse.data.toUpperCase();

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select(
      "scores, section_company, section_founder_challenges, section_cofounder, section_life_outlook, section_ambition, section_burnout, section_depression, section_anxiety, section_adhd, section_founder_stress, section_autism, section_dark_triad, created_at, completed"
    )
    .eq("anonymous_token", token)
    .maybeSingle();

  if (error) {
    log.error("results_db_error", {
      token: tokenPrefix(token),
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "We couldn't load your results. Please try again in a moment." },
      { status: 503 }
    );
  }

  if (!data) {
    log.info("results_not_found", { token: tokenPrefix(token) });
    return NextResponse.json({ error: "Results not found for this code." }, { status: 404 });
  }

  if (!data.scores) {
    // Raw data was saved but scoring hasn't completed (see submit route safety net).
    log.warn("results_scoring_pending", { token: tokenPrefix(token) });
    return NextResponse.json(
      { error: "Your results are still being computed. Please refresh in a moment." },
      { status: 202 }
    );
  }

  // Backfill scores blob for older rows that pre-date AQ-10 / Dark Triad
  // scoring. Section data is stored separately (one column per section),
  // so we can recompute deterministically without re-asking the user.
  const stored = data.scores as AllScores | null;
  const scores: AllScores | null = stored
    ? {
        ...stored,
        aq10:
          stored.aq10 ??
          scoreAQ10((data.section_autism as SurveyResponses) ?? {}),
        darkTriad:
          stored.darkTriad ??
          scoreDarkTriad((data.section_dark_triad as SurveyResponses) ?? {}),
      }
    : null;

  log.info("results_fetched", { token: tokenPrefix(token) });
  return NextResponse.json({
    scores,
    section_company: data.section_company,
    section_founder_challenges: data.section_founder_challenges,
    section_cofounder: data.section_cofounder,
    section_life_outlook: data.section_life_outlook,
    section_ambition: data.section_ambition,
    section_burnout: data.section_burnout,
    section_depression: data.section_depression,
    section_anxiety: data.section_anxiety,
    section_adhd: data.section_adhd,
    // Kept for backward compat with any pre-V3 rows still in the DB.
    section_founder_stress: data.section_founder_stress,
    created_at: data.created_at,
  });
}
