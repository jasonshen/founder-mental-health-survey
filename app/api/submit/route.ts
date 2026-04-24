import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { computeAllScores } from "@/lib/scoring";
import { SurveySubmissionSchema } from "@/lib/schemas";
import { generateToken } from "@/lib/token";
import { log, tokenPrefix } from "@/lib/log";
import { SECTION_COLUMN } from "@/lib/types";
import type { SectionId, SurveyResponses } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_TOKEN_RETRIES = 5;

/**
 * Turn the `{sectionId: {qid: value}}` payload into an object keyed by
 * actual DB column name, ignoring any unknown section ids. The set of
 * allowed keys is closed (SECTION_COLUMN), so the dynamic property
 * assignment is safe.
 */
function toColumnUpdates(
  responses: Record<string, SurveyResponses>
): Record<string, SurveyResponses> {
  const out: Record<string, SurveyResponses> = {};
  for (const [sectionId, payload] of Object.entries(responses)) {
    const column = SECTION_COLUMN[sectionId as SectionId];
    if (column) out[column] = payload;
  }
  return out;
}

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
  const columnUpdates = toColumnUpdates(responses);
  const supabase = createServerClient();

  // Idempotency + partial-row finalize.
  if (submission_id) {
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("anonymous_token, completed")
      .eq("submission_id", submission_id)
      .maybeSingle();

    if (existing?.completed && existing.anonymous_token) {
      log.info("submit_idempotent_return", {
        token: tokenPrefix(existing.anonymous_token),
      });
      return NextResponse.json({
        success: true,
        token: existing.anonymous_token,
      });
    }

    if (existing && !existing.completed) {
      return finalizeExisting(supabase, submission_id, columnUpdates);
    }
  }

  // No prior partial row — INSERT fresh.
  let token = "";
  let insertError: { code?: string; message?: string } | null = null;
  for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
    token = generateToken();

    const { error } = await supabase.from("survey_responses").insert({
      anonymous_token: token,
      submission_id: submission_id ?? null,
      ...columnUpdates,
      scores: null,
      completed: false,
    });

    if (!error) {
      insertError = null;
      break;
    }

    if (error.code === "23505" && error.message?.includes("anonymous_token")) {
      log.warn("submit_token_collision", { attempt });
      insertError = error;
      continue;
    }

    if (error.code === "23505" && error.message?.includes("submission_id")) {
      const { data: winner } = await supabase
        .from("survey_responses")
        .select("anonymous_token, completed")
        .eq("submission_id", submission_id!)
        .maybeSingle();
      if (winner?.completed && winner.anonymous_token) {
        log.info("submit_race_resolved", {
          token: tokenPrefix(winner.anonymous_token),
        });
        return NextResponse.json({
          success: true,
          token: winner.anonymous_token,
        });
      }
      if (winner && !winner.completed) {
        return finalizeExisting(supabase, submission_id!, columnUpdates);
      }
    }

    log.error("submit_db_insert_failed", {
      code: error.code,
      message: error.message,
    });
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
  return computeAndMarkComplete(supabase, token, responses);
}

async function finalizeExisting(
  supabase: ReturnType<typeof createServerClient>,
  submission_id: string,
  columnUpdates: Record<string, SurveyResponses>
) {
  for (let attempt = 0; attempt < MAX_TOKEN_RETRIES; attempt++) {
    const token = generateToken();
    const { error } = await supabase
      .from("survey_responses")
      .update({
        anonymous_token: token,
        ...columnUpdates,
      })
      .eq("submission_id", submission_id)
      .eq("completed", false);

    if (!error) {
      log.info("submit_finalized_partial", { token: tokenPrefix(token) });
      // Fetch the finalized row's responses to compute scores against authoritative state.
      return computeAndMarkCompleteWithResponses(supabase, token, columnUpdates);
    }

    if (error.code === "23505" && error.message?.includes("anonymous_token")) {
      log.warn("submit_token_collision_finalize", { attempt });
      continue;
    }

    log.error("submit_finalize_failed", {
      code: error.code,
      message: error.message,
    });
    return NextResponse.json(
      { error: "We couldn't save your responses. Please try again." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "We couldn't save your responses. Please try again." },
    { status: 503 }
  );
}

async function computeAndMarkComplete(
  supabase: ReturnType<typeof createServerClient>,
  token: string,
  responses: Record<string, SurveyResponses>
) {
  try {
    const scores = computeAllScores({
      adhd: responses.adhd ?? {},
      depression: responses.depression ?? {},
      anxiety: responses.anxiety ?? {},
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

/**
 * Finalize path — columnUpdates is keyed by DB column, so read scoring
 * sections directly out of it by their column names.
 */
async function computeAndMarkCompleteWithResponses(
  supabase: ReturnType<typeof createServerClient>,
  token: string,
  columnUpdates: Record<string, SurveyResponses>
) {
  try {
    const scores = computeAllScores({
      adhd: columnUpdates.section_adhd ?? {},
      depression: columnUpdates.section_depression ?? {},
      anxiety: columnUpdates.section_anxiety ?? {},
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
