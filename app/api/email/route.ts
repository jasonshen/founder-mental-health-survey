import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { EmailSubmissionSchema } from "@/lib/schemas";
import { log, tokenPrefix } from "@/lib/log";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = EmailSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    log.warn("email_validation_failed", {
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

  const data = parsed.data;
  const token = data.token.toUpperCase();
  const supabase = createServerClient();

  // Verify token exists in survey_responses.
  const { data: survey, error: surveyError } = await supabase
    .from("survey_responses")
    .select("anonymous_token")
    .eq("anonymous_token", token)
    .maybeSingle();

  if (surveyError) {
    log.error("email_db_read_error", {
      token: tokenPrefix(token),
      code: surveyError.code,
    });
    return NextResponse.json(
      { error: "We couldn't save your email. Please try again." },
      { status: 503 }
    );
  }

  if (!survey) {
    log.warn("email_token_not_found", { token: tokenPrefix(token) });
    return NextResponse.json(
      { error: "Results not found for this code." },
      { status: 404 }
    );
  }

  const { error: insertError } = await supabase.from("email_contacts").insert({
    anonymous_token: token,
    email: data.email,
    wants_report: data.wants_report,
    wants_coaching: data.wants_coaching,
    wants_retreat: data.wants_retreat,
    wants_plant_medicine: data.wants_plant_medicine,
    wants_updates: data.wants_updates,
  });

  if (insertError) {
    log.error("email_db_insert_error", {
      token: tokenPrefix(token),
      code: insertError.code,
      message: insertError.message,
    });
    return NextResponse.json(
      { error: "We couldn't save your email. Please try again." },
      { status: 503 }
    );
  }

  log.info("email_captured", { token: tokenPrefix(token) });
  return NextResponse.json({ success: true });
}
