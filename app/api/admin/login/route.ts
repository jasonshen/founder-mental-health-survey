import { NextResponse } from "next/server";
import { z } from "zod";
import { adminCookieName } from "@/lib/admin-auth";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

const Body = z.object({ password: z.string().min(1).max(256) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    log.error("admin_login_no_password_configured");
    return NextResponse.json(
      { error: "Admin not configured. Set ADMIN_PASSWORD env var." },
      { status: 500 }
    );
  }

  if (parsed.data.password !== expected) {
    log.warn("admin_login_bad_password");
    // Generic error on purpose.
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  log.info("admin_login_success");
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: adminCookieName(),
    value: expected,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return response;
}
