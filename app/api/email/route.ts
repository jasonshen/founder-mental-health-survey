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
import type { AllScores } from "@/lib/types";

export const dynamic = "force-dynamic";

function resolveBaseUrl(request: Request): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (envUrl) return envUrl.replace(/\/$/, "");
  // Fallback: derive from the request URL.
  try {
    const u = new URL(request.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return "";
  }
}

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

  // Verify token exists in survey_responses AND grab scores for the email.
  const { data: survey, error: surveyError } = await supabase
    .from("survey_responses")
    .select("anonymous_token, scores")
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

  // Fire confirmation email (don't block the response on send success or failure —
  // the user has already seen "Thanks for leaving your email" in the UI).
  if (survey.scores) {
    const baseUrl = resolveBaseUrl(request);
    const resultsUrl = `${baseUrl}/results/${token}`;
    const emailArgs = {
      token,
      resultsUrl,
      scores: survey.scores as AllScores,
      interests: {
        report: data.wants_report,
        coaching: data.wants_coaching,
        retreat: data.wants_retreat,
        plantMedicine: data.wants_plant_medicine,
        updates: data.wants_updates,
      },
    };

    // Await the send but swallow failures — send errors are logged in sendEmail.
    await sendEmail({
      to: data.email,
      subject: confirmationEmailSubject(),
      html: confirmationEmailHtml(emailArgs),
      text: confirmationEmailText(emailArgs),
    });
  } else {
    log.warn("email_sent_skipped_no_scores", { token: tokenPrefix(token) });
  }

  return NextResponse.json({ success: true });
}
