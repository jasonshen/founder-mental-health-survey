import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, email, wants_report, wants_updates } = body;

    if (
      !token ||
      !email ||
      typeof wants_report !== "boolean" ||
      typeof wants_updates !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
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

    // Insert into email_contacts
    const { error: insertError } = await supabase
      .from("email_contacts")
      .insert({
        anonymous_token: token,
        email,
        wants_report,
        wants_updates,
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
