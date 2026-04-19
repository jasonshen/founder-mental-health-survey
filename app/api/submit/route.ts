import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { computeAllScores } from "@/lib/scoring";
import { SurveySubmissionSchema } from "@/lib/schemas";
import { generateToken } from "@/lib/token";
import { log, tokenPrefix } from "@/lib/log";

export const dynamic = "force-dynamic";

const MAX_TOKEN_RETRIES = 5;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SurveySubmissionSchema.safeParse(body);
  if (!parsed.success) {
    log.warn("submit_validation_failed", {
      issues: parsed.error.issues.slice(0, 5).map((i) => ({
        path: i.path.join("."),
        code: i.code,
      })),
    });
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { responses, submission_id } = parsed.data;
  const supabase = createServerClient();

  // Idempotency check: if client retried with the same submission_id,
  // return the existing row's token instead of creating a duplicate.
  if (submission_id) {
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("anonymous_token")
      .eq("submission_id", submission_id)
      .maybeSingle();

    if (existing?.anonymous_token) {
      log.info("submit_idempotent_return", { token: tokenPrefix(existing.anonymous_token) });
      return NextResponse.json({ success: true, token: existing.anonymous_token });
    }
  }

  // Server-generates the token. Retry on rare collision.
  let token = "";
  let insertError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
    token = generateToken();

    // Persist raw responses FIRST with no scores — safety net if scoring throws.
    const { error } = await supabase.from("survey_responses").insert({
      anonymous_token: token,
      submission_id: submission_id ?? null,
      section_company: responses.company,
      section_adhd: responses.adhd,
      section_depression: responses.depression,
      section_anxiety: responses.anxiety,
      section_founder_stress: responses.founder_stress,
      scores: null,
      completed: false,
    });

    if (!error) {
      insertError = null;
      break;
    }

    // Postgres unique_violation is 23505. Retry on token collision.
    if (error.code === "23505" && error.message?.includes("anonymous_token")) {
      log.warn("submit_token_collision", { attempt });
      insertError = error;
      continue;
    }

    // Unique violation on submission_id → another request got here first. Return its token.
    if (error.code === "23505" && error.message?.includes("submission_id")) {
      const { data: winner } = await supabase
        .from("survey_responses")
        .select("anonymous_token")
        .eq("submission_id", submission_id!)
        .maybeSingle();
      if (winner?.anonymous_token) {
        log.info("submit_race_resolved", { token: tokenPrefix(winner.anonymous_token) });
        return NextResponse.json({ success: true, token: winner.anonymous_token });
      }
    }

    log.error("submit_db_insert_failed", { code: error.code, message: error.message });
    insertError = error;
    break;
  }

  if (insertError) {
    return NextResponse.json(
      { error: "We couldn't save your responses. Please try again." },
      { status: 503 }
    );
  }

  log.info("submit_persisted", { token: tokenPrefix(token) });

  // Now compute scores and update the row. If this fails, the raw data is safe.
  try {
    const scores = computeAllScores({
      adhd: responses.adhd,
      depression: responses.depression,
      anxiety: responses.anxiety,
    });

    const { error: updateError } = await supabase
      .from("survey_responses")
      .update({ scores, completed: true })
      .eq("anonymous_token", token);

    if (updateError) {
      log.error("submit_score_update_failed", {
        token: tokenPrefix(token),
        code: updateError.code,
        message: updateError.message,
      });
      // Responses are saved — return success with a flag so results page can retry later.
      return NextResponse.json({ success: true, token, scoring_pending: true });
    }

    log.info("submit_complete", { token: tokenPrefix(token) });
    return NextResponse.json({ success: true, token });
  } catch (err) {
    log.error("submit_scoring_threw", {
      token: tokenPrefix(token),
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ success: true, token, scoring_pending: true });
  }
}
