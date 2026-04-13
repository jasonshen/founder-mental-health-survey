import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { computeAllScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, responses } = body;

    if (!token || !responses) {
      return NextResponse.json(
        { error: "Missing token or responses" },
        { status: 400 }
      );
    }

    const scores = computeAllScores(responses);

    const supabase = createServerClient();
    const { error } = await supabase.from("survey_responses").insert({
      anonymous_token: token,
      section_company: responses.company,
      section_adhd: responses.adhd,
      section_depression: responses.depression,
      section_anxiety: responses.anxiety,
      section_founder_stress: responses.founder_stress,
      scores,
      completed: true,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
