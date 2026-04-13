import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("survey_responses")
      .select("scores, section_company, section_founder_stress, created_at")
      .eq("anonymous_token", token)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Survey response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      scores: data.scores,
      section_company: data.section_company,
      section_founder_stress: data.section_founder_stress,
      created_at: data.created_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
