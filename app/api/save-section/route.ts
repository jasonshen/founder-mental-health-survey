import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { SectionSaveSchema } from "@/lib/schemas";
import { SECTION_COLUMN } from "@/lib/types";
import type { SectionId } from "@/lib/types";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SectionSaveSchema.safeParse(body);
  if (!parsed.success) {
    log.warn("save_section_validation_failed", {
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

  const { submission_id, section_id, responses } = parsed.data;
  const column = SECTION_COLUMN[section_id as SectionId];
  if (!column) {
    // Should be impossible — section_id is validated by Zod enum.
    return NextResponse.json({ error: "Unknown section" }, { status: 400 });
  }

  const supabase = createServerClient();

  // Look up the in-progress row, if any.
  const { data: existing, error: fetchError } = await supabase
    .from("survey_responses")
    .select("id, sections_completed, completed")
    .eq("submission_id", submission_id)
    .maybeSingle();

  if (fetchError) {
    log.error("save_section_fetch_failed", {
      code: fetchError.code,
      message: fetchError.message,
    });
    return NextResponse.json(
      { error: "Couldn't load progress." },
      { status: 503 }
    );
  }

  if (existing?.completed) {
    return NextResponse.json(
      { error: "Submission already finalized." },
      { status: 409 }
    );
  }

  const priorCompleted: string[] = existing?.sections_completed ?? [];
  const sections_completed = priorCompleted.includes(section_id)
    ? priorCompleted
    : [...priorCompleted, section_id];

  const basePayload: Record<string, unknown> = {
    [column]: responses,
    sections_completed,
    last_section_completed: section_id,
    updated_at: new Date().toISOString(),
  };

  if (!existing) {
    // First save for this submission_id — INSERT a partial row.
    // anonymous_token is nullable (see migration 007); final submit assigns it.
    const insertPayload: Record<string, unknown> = {
      submission_id,
      completed: false,
      scores: null,
      sections_completed: [],
      ...basePayload,
    };
    const { error: insertError } = await supabase
      .from("survey_responses")
      .insert(insertPayload);

    if (insertError) {
      // Race: another request INSERTed first. Fall through to UPDATE.
      if (
        insertError.code === "23505" &&
        insertError.message?.includes("submission_id")
      ) {
        const { error: updateError } = await supabase
          .from("survey_responses")
          .update(basePayload)
          .eq("submission_id", submission_id)
          .eq("completed", false);
        if (updateError) {
          log.error("save_section_update_after_race_failed", {
            code: updateError.code,
            message: updateError.message,
          });
          return NextResponse.json(
            { error: "Couldn't save progress." },
            { status: 503 }
          );
        }
      } else {
        log.error("save_section_insert_failed", {
          code: insertError.code,
          message: insertError.message,
        });
        return NextResponse.json(
          { error: "Couldn't save progress." },
          { status: 503 }
        );
      }
    }
  } else {
    const { error: updateError } = await supabase
      .from("survey_responses")
      .update(basePayload)
      .eq("submission_id", submission_id)
      .eq("completed", false);
    if (updateError) {
      log.error("save_section_update_failed", {
        code: updateError.code,
        message: updateError.message,
      });
      return NextResponse.json(
        { error: "Couldn't save progress." },
        { status: 503 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    submission_id,
    sections_completed: sections_completed as SectionId[],
  });
}
