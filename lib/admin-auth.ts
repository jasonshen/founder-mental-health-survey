import { cookies } from "next/headers";

const COOKIE_NAME = "fmh_admin_auth";

/**
 * Admin auth is a simple shared password stored in ADMIN_PASSWORD env var.
 * On login, we set a cookie set to the password itself (via Set-Cookie from
 * the server). Subsequent requests compare. This is not a real auth system —
 * it's a lock on a door you alone have the key to.
 *
 * For production with multiple admins, swap this for Vercel Sign-in or Clerk.
 */
export async function isAdminAuthed(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false; // no password set → no admin access ever
  const jar = await cookies();
  const got = jar.get(COOKIE_NAME)?.value;
  return got === expected;
}

export function adminCookieName() {
  return COOKIE_NAME;
}
