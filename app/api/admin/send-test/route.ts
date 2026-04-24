import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import {
  confirmationEmailHtml,
  confirmationEmailSubject,
  confirmationEmailText,
} from "@/lib/emails/confirmation";
import { log } from "@/lib/log";
import type { AllScores } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  to: z.string().email(),
});

const SAMPLE_SCORES: AllScores = {
  phq9: {
    score: 8,
    severity: "mild",
    general_pop_band_pct: 24,
    suicidal_ideation_flagged: false,
  },
  gad7: {
    score: 11,
    severity: "moderate",
    general_pop_band_pct: 12,
  },
  asrs: {
    items_flagged: 4,
    above_threshold: true,
    general_pop_above_threshold_pct: 8,
  },
};

function baseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid email required" },
      { status: 400 }
    );
  }

  const token = "FMH-TEST";
  const resultsUrl = `${baseUrl()}/results/${token}`;
  const interests = {
    report: true,
    coaching: false,
    retreat: false,
    plantMedicine: false,
    updates: false,
  };

  const result = await sendEmail({
    to: parsed.data.to,
    subject: `[TEST] ${confirmationEmailSubject()}`,
    html: confirmationEmailHtml({
      token,
      resultsUrl,
      scores: SAMPLE_SCORES,
      interests,
    }),
    text: confirmationEmailText({
      token,
      resultsUrl,
      scores: SAMPLE_SCORES,
      interests,
    }),
  });

  if (!result.sent) {
    log.warn("admin_test_email_failed", {
      reason: result.reason,
      detail: result.detail,
    });
    return NextResponse.json(
      {
        sent: false,
        reason: result.reason,
        detail:
          result.reason === "no_provider"
            ? "RESEND_API_KEY is not set. Install Resend via Vercel Marketplace, then redeploy."
            : result.detail,
      },
      { status: 502 }
    );
  }

  log.info("admin_test_email_sent", { id: result.id });
  return NextResponse.json({ sent: true, id: result.id });
}
