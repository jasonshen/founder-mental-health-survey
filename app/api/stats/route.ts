import { NextResponse } from "next/server";

import { createServerClient } from "@/lib/supabase";
import {
  STATS_SELECT_COLUMNS,
  computeStats,
  type StatsBundle,
  type SurveyRow,
} from "@/lib/aggregates";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

const TTL_MS = 10 * 60 * 1000; // 10 minutes
let cached: { data: StatsBundle; expires: number } | null = null;

async function fetchFresh(): Promise<StatsBundle> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select(STATS_SELECT_COLUMNS)
    .range(0, 9999);
  if (error) throw new Error(error.message);
  return computeStats((data ?? []) as unknown as SurveyRow[]);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const force = url.searchParams.get("refresh") === "1";

  try {
    if (!force && cached && cached.expires > Date.now()) {
      return NextResponse.json(
        { ...cached.data, cache: "hit", expires_at: new Date(cached.expires).toISOString() },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const fresh = await fetchFresh();
    cached = { data: fresh, expires: Date.now() + TTL_MS };
    return NextResponse.json(
      { ...fresh, cache: "miss", expires_at: new Date(cached.expires).toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    log.error("stats_query_failed", { message });
    return NextResponse.json(
      { error: "Couldn't load stats." },
      { status: 503 }
    );
  }
}
