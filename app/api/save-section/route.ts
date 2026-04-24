import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { SectionSaveSchema } from "@/lib/schemas";
import { LEGACY_SECTION_COLUMNS } from "@/lib/types";
import type { SectionId } from "@/lib/types";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

const LEGACY_COLUMN_FOR: Record<string, string> = {
  company: "section_company",
  adhd: "section_adhd",
  depression: "section_depression",
  anxiety: "section_anxiety",
  founder_stress: "section_founder_stress",
};

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
  const supabase = createServerClient();
  const isLegacy = (LEGACY_SECTION_COLUMNS as string[]).includes(section_id);

  // Look up the in-progress row, if any.
  const { data: existing, error: fetchError } = await supabase
    .from("survey_responses")
    .select("id, sections_completed, sections_ext, completed")
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

  // If the final submit has already landed, refuse further partial writes.
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

  const nowIso = new Date().toISOString();

  const basePayload: Record<string, unknown> = {
    sections_completed,
    last_section_completed: section_id,
    updated_at: nowIso,
  };

  if (isLegacy) {
    basePayload[LEGACY_COLUMN_FOR[section_id]] = responses;
  } else {
    const priorExt: Record<string, unknown> =
      (existing?.sections_ext as Record<string, unknown>) ?? {};
    basePayload.sections_ext = { ...priorExt, [section_id]: responses };
  }

  if (!existing) {
    // First save for this submission_id — INSERT a partial row.
    const insertPayload: Record<string, unknown> = {
      submission_id,
      completed: false,
      scores: null,
      sections_ext: {},
      sections_completed: [],
      ...basePayload,
    };
    const { error: insertError } = await supabase
      .from("survey_responses")
      .insert(insertPayload);

    if (insertError) {
      // Race: another request INSERTed first. Fall through to UPDATE below.
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
