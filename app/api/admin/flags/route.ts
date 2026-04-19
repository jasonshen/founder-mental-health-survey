import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthed } from "@/lib/admin-auth";
import { FLAG_KEYS, setFlag, type FlagKey } from "@/lib/flags";

export const dynamic = "force-dynamic";

const Body = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
});

const VALID_KEYS = new Set<string>(Object.values(FLAG_KEYS));

export async function POST(request: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (!VALID_KEYS.has(parsed.data.key)) {
    return NextResponse.json({ error: "Unknown flag key" }, { status: 400 });
  }

  try {
    await setFlag(parsed.data.key as FlagKey, parsed.data.enabled);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update flag" },
      { status: 500 }
    );
  }
}
