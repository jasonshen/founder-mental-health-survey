import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { TokenParamSchema } from "@/lib/schemas";
import { log, tokenPrefix } from "@/lib/log";

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
    .select("scores, section_company, section_founder_stress, created_at, completed")
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

  log.info("results_fetched", { token: tokenPrefix(token) });
  return NextResponse.json({
    scores: data.scores,
    section_company: data.section_company,
    section_founder_stress: data.section_founder_stress,
    created_at: data.created_at,
  });
}
