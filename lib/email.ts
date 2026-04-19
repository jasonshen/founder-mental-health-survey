import { Resend } from "resend";
import { log } from "./log";

/**
 * Resend wrapper. Degrades gracefully if RESEND_API_KEY isn't set
 * (e.g., before the user wires up the Resend integration) — we log the
 * send as pending instead of throwing, so email capture still succeeds.
 */

const FROM_DEFAULT = process.env.EMAIL_FROM || "Founder MH <onboarding@resend.dev>";

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<
  | { sent: true; id: string }
  | { sent: false; reason: "no_provider" | "error"; detail?: string }
> {
  const client = getClient();
  if (!client) {
    log.warn("email_skipped_no_provider", { to: args.to.split("@")[1] });
    return { sent: false, reason: "no_provider" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_DEFAULT,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    });

    if (error) {
      log.error("email_send_error", {
        name: error.name,
        message: error.message,
      });
      return { sent: false, reason: "error", detail: error.message };
    }

    log.info("email_sent", { id: data?.id, domain: args.to.split("@")[1] });
    return { sent: true, id: data?.id ?? "unknown" };
  } catch (err) {
    log.error("email_send_threw", {
      message: err instanceof Error ? err.message : String(err),
    });
    return {
      sent: false,
      reason: "error",
      detail: err instanceof Error ? err.message : undefined,
    };
  }
}
