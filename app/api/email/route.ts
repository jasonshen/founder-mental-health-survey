import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      token,
      email,
      wants_report,
      wants_coaching,
      wants_retreat,
      wants_plant_medicine,
      wants_updates,
    } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify token exists in survey_responses
    const { data: survey, error: surveyError } = await supabase
      .from("survey_responses")
      .select("anonymous_token")
      .eq("anonymous_token", token)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: "Survey response not found for this token" },
        { status: 404 }
      );
    }

    const { error: insertError } = await supabase
      .from("email_contacts")
      .insert({
        anonymous_token: token,
        email,
        wants_report: wants_report ?? false,
        wants_coaching: wants_coaching ?? false,
        wants_retreat: wants_retreat ?? false,
        wants_plant_medicine: wants_plant_medicine ?? false,
        wants_updates: wants_updates ?? false,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
