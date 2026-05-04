import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { EmailSubmissionSchema } from "@/lib/schemas";
import { log, tokenPrefix } from "@/lib/log";
import { sendEmail } from "@/lib/email";
import {
  confirmationEmailHtml,
  confirmationEmailText,
  confirmationEmailSubject,
} from "@/lib/emails/confirmation";

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

  // Verify token exists in survey_responses AND grab cohort for the email.
  // We deliberately do NOT pull scores here — the confirmation email no longer
  // includes survey content; including scores would re-create the email↔response
  // linkage we promise respondents we don't keep.
  const { data: survey, error: surveyError } = await supabase
    .from("survey_responses")
    .select("anonymous_token, cohort")
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

  // PRIVACY: we intentionally do NOT store the token alongside the email.
  // email_contacts must not be joinable to survey_responses — that's the
  // structural guarantee we make to respondents. The token is used only to
  // verify the response exists; it is not echoed back in the confirmation
  // email (or in any later report email), so respondents who lose their
  // token cannot recover it from us. See migration 005_privacy_hardening.sql.
  const { error: insertError } = await supabase.from("email_contacts").insert({
    email: data.email,
    wants_report: data.wants_report,
    wants_coaching: data.wants_coaching,
    wants_retreat: data.wants_retreat,
    wants_plant_medicine: data.wants_plant_medicine,
    wants_updates: data.wants_updates,
  });

  if (insertError) {
    log.error("email_db_insert_error", {
      // token is not recorded against this failure either — logs must not
      // re-create the email↔token linkage we just avoided in the DB.
      code: insertError.code,
      message: insertError.message,
    });
    return NextResponse.json(
      { error: "We couldn't save your email. Please try again." },
      { status: 503 }
    );
  }

  log.info("email_captured", {}); // no token — see note above.

  // Fire confirmation email (don't block the response on send success or failure —
  // the user has already seen "Thanks for leaving your email" in the UI).
  const cohort = (survey.cohort as "yc" | "general" | null) ?? null;
  const emailArgs = {
    cohort,
    interests: {
      coaching: data.wants_coaching,
      retreat: data.wants_retreat,
      plantMedicine: data.wants_plant_medicine,
      updates: data.wants_updates,
    },
  };

  // Await the send but swallow failures — send errors are logged in sendEmail.
  await sendEmail({
    to: data.email,
    subject: confirmationEmailSubject(cohort),
    html: confirmationEmailHtml(emailArgs),
    text: confirmationEmailText(emailArgs),
  });

  return NextResponse.json({ success: true });
}
