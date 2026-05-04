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

export const dynamic = "force-dynamic";

const Body = z.object({
  to: z.string().email(),
  cohort: z.enum(["yc", "general"]).optional(),
});

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

  const cohort = parsed.data.cohort ?? "yc";
  const interests = {
    coaching: true,
    retreat: false,
    plantMedicine: true,
    updates: true,
  };

  const result = await sendEmail({
    to: parsed.data.to,
    subject: `[TEST] ${confirmationEmailSubject(cohort)}`,
    html: confirmationEmailHtml({ cohort, interests }),
    text: confirmationEmailText({ cohort, interests }),
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
