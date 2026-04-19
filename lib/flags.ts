import { createServerClient } from "./supabase";
import { log } from "./log";

export const FLAG_KEYS = {
  founderCohortPercentiles: "founder_cohort_percentiles",
} as const;

export type FlagKey = (typeof FLAG_KEYS)[keyof typeof FLAG_KEYS];

// Simple per-request cache so multiple reads in one request don't hit the DB repeatedly.
const requestCache = new Map<string, { enabled: boolean; cachedAt: number }>();
const CACHE_TTL_MS = 30_000;

export async function isFlagEnabled(key: FlagKey): Promise<boolean> {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.enabled;
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      log.warn("flag_read_error", { key, code: error.code });
      return false;
    }

    const enabled = data?.enabled ?? false;
    requestCache.set(key, { enabled, cachedAt: Date.now() });
    return enabled;
  } catch (err) {
    log.error("flag_read_threw", {
      key,
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export async function setFlag(key: FlagKey, enabled: boolean): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) {
    log.error("flag_write_error", { key, code: error.code, message: error.message });
    throw new Error(`Failed to set flag ${key}`);
  }

  requestCache.delete(key);
  log.info("flag_set", { key, enabled });
}

export async function getAllFlags() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select("key, enabled, description, updated_at")
    .order("key");

  if (error) {
    log.error("flag_list_error", { code: error.code });
    return [];
  }

  return data ?? [];
}
