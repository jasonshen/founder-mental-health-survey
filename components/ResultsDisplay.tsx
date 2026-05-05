"use client";

import { useEffect, useState } from "react";
import type {
  ResultsResponse,
  PHQ9Severity,
  GAD7Severity,
  SurveyResponses,
} from "@/lib/types";
import CrisisBanner from "./CrisisBanner";
import ResultsCard from "./ResultsCard";

// V3 founder challenges (section_founder_challenges, fc_* keys)
const CHALLENGE_LABELS: Record<string, string> = {
  fc_own_way: "Getting in my own way",
  fc_ic_to_leader: "Evolving from IC to leader",
  fc_operational_trap: "Operational vs. strategic",
  fc_fraud: "Feeling like a fraud",
  fc_accountability: "Holding team accountable",
  fc_hard_conversations: "Avoiding hard conversations",
  fc_team_slow: "Team moving too slowly",
  fc_cofounder_friction: "Cofounder friction",
  fc_board_conflict: "Board / investor conflict",
  fc_runway_worry: "Running out of money",
  fc_next_round: "Raising next round",
  fc_pivot: "Pivoting the company",
  fc_growth: "Not growing fast enough",
  fc_competition: "Competition anxiety",
};

// Roll up the 14 challenge items into 4 themes. Keeps the results page
// compact — respondents see one bar per theme, plus their worst item
// in each theme as a subhead.
const CHALLENGE_GROUPS: Array<{
  id: string;
  label: string;
  description: string;
  items: string[];
}> = [
  {
    id: "self_leadership",
    label: "Self-Leadership",
    description: "How you lead yourself",
    items: ["fc_own_way", "fc_ic_to_leader", "fc_operational_trap", "fc_fraud"],
  },
  {
    id: "team_execution",
    label: "Team & Execution",
    description: "How the team moves",
    items: ["fc_accountability", "fc_hard_conversations", "fc_team_slow"],
  },
  {
    id: "relationships",
    label: "Cofounder & Board",
    description: "Key relationships",
    items: ["fc_cofounder_friction", "fc_board_conflict"],
  },
  {
    id: "business",
    label: "Business Risk",
    description: "External pressures on the company",
    items: [
      "fc_runway_worry",
      "fc_next_round",
      "fc_pivot",
      "fc_growth",
      "fc_competition",
    ],
  },
];

// Reverse-coded 2026-05-05: low challenge → high score so the bar fills
// toward green when the founder is doing well. Displayed as X / 5
// (zero-indexed 5-point scale; values 1-5 line up with the green/blue/red
// banding used elsewhere on the page).
const CHALLENGE_VALUE_MAP: Record<string, number> = {
  "Not a challenge for me": 5,
  "Minor challenge": 4,
  "Moderate challenge": 3,
  "Significant challenge": 2,
  "Major challenge": 1,
};

// V2 legacy stressors (section_founder_stress, fs_* keys) — kept so
// any pre-V3 rows still render cleanly if someone opens an old token.
const STRESS_LABELS: Record<string, string> = {
  fs_runway: "Financial pressure / runway",
  fs_loneliness: "Loneliness & isolation",
  fs_cofounder: "Co-founder / team strain",
  fs_identity: "Identity tied to company",
  fs_sleep: "Sleep quality",
};

const STRESS_VALUE_MAP: Record<string, number> = {
  "Not at all": 0,
  "Slightly": 1,
  "Moderately": 2,
  "Very much": 3,
  "Extremely": 4,
};

// Likert / frequency lookups used by the new cards (cofounder, ambition, burnout).
// Mirror the option arrays in lib/questions.ts.
const AGREE_5_VALUES: Record<string, number> = {
  "Strongly disagree": 1,
  Disagree: 2,
  "Neither agree nor disagree": 3,
  Agree: 4,
  "Strongly agree": 5,
};

const IMPORTANCE_5_VALUES: Record<string, number> = {
  "Not at all important": 1,
  "Slightly important": 2,
  "Moderately important": 3,
  "Very important": 4,
  "Extremely important": 5,
};

const MBI_FREQ_VALUES: Record<string, number> = {
  Never: 0,
  "A few times a year": 1,
  "Once a month or less": 2,
  "A few times a month": 3,
  "Once a week": 4,
  "A few times a week": 5,
  "Every day": 6,
};

// Standardized 3-band color picker for "mean on a scale" bars.
//   ≥ 80% of range  → green  (good)
//   40% – 80%       → blue   (mid)
//   < 40%           → red    (poor)
// Pass inverted=true for metrics where high indicates a problem (need-frustration,
// exhaustion, controlled regulation) so the labels swap (high → red, low → green).
function bandColor(
  value: number | null,
  min: number,
  max: number,
  inverted = false
): string {
  if (value === null || max === min) return "bg-gray-300";
  const ratio = (value - min) / (max - min);
  const high = ratio >= 0.8;
  const low = ratio < 0.4;
  if (inverted) {
    if (high) return "bg-rose-400";
    if (low) return "bg-emerald-400";
    return "bg-blue-400";
  }
  if (high) return "bg-emerald-400";
  if (low) return "bg-rose-400";
  return "bg-blue-400";
}

function meanOf(
  responses: SurveyResponses | null | undefined,
  ids: string[],
  map?: Record<string, number>
): { mean: number | null; answered: number } {
  if (!responses) return { mean: null, answered: 0 };
  let sum = 0;
  let count = 0;
  for (const id of ids) {
    const raw = responses[id];
    if (raw === undefined || raw === null || raw === "") continue;
    const n =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && map
          ? map[raw]
          : Number(raw);
    if (!Number.isFinite(n)) continue;
    sum += n as number;
    count++;
  }
  return {
    mean: count > 0 ? Number((sum / count).toFixed(2)) : null,
    answered: count,
  };
}

function formatPHQ9Severity(severity: PHQ9Severity): string {
  switch (severity) {
    case "none": return "None/Minimal";
    case "mild": return "Mild";
    case "moderate": return "Moderate";
    case "moderately_severe": return "Moderately Severe";
    case "severe": return "Severe";
  }
}

function formatGAD7Severity(severity: GAD7Severity): string {
  switch (severity) {
    case "none": return "None/Minimal";
    case "mild": return "Mild";
    case "moderate": return "Moderate";
    case "severe": return "Severe";
  }
}

function severityColor(severity: PHQ9Severity | GAD7Severity): string {
  switch (severity) {
    case "none": return "text-emerald-700 bg-emerald-50";
    case "mild": return "text-amber-700 bg-amber-50";
    case "moderate": return "text-orange-700 bg-orange-50";
    case "moderately_severe": return "text-rose-700 bg-rose-50";
    case "severe": return "text-rose-800 bg-rose-50";
  }
}

// Score-based bar width: percentage of the instrument's max possible score.
// This means a 0 score shows an empty bar (correctly) and a max score shows
// a full bar — earlier band-based widths gave a 0 score a misleading 20%
// fill and made all "severe" scores look identical.
function scoreBarWidth(score: number, maxScore: number): string {
  const pct = Math.max(0, Math.min(100, (score / maxScore) * 100));
  return `${pct}%`;
}

function severityBarColor(severity: PHQ9Severity | GAD7Severity): string {
  switch (severity) {
    case "none": return "bg-emerald-400";
    case "mild": return "bg-amber-400";
    case "moderate": return "bg-orange-400";
    case "moderately_severe": return "bg-rose-400";
    case "severe": return "bg-rose-500";
  }
}

interface ResultsDisplayProps {
  token: string;
}

interface CohortData {
  N: number;
  phq9: { percentile: number; mean: number };
  gad7: { percentile: number; mean: number };
  asrs: { percentile: number; above_threshold_pct: number };
}

function DarkTriadRow({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  if (value === null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          <span className="text-sm text-gray-400">No answers</span>
        </div>
      </div>
    );
  }
  // 1-5 scale → 0-100% bar. Subtract 1 from numerator so a true "1"
  // (strongly disagree on every item) renders as an empty bar rather
  // than 20% — same fix we applied to PHQ-9 / GAD-7.
  // Dark Triad bars are intentionally neutral grey: the score reflects
  // a personality trait that isn't inherently good or bad, so the page
  // shouldn't editorialize via color.
  const pct = Math.max(0, Math.min(100, ((value - 1) / 4) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {value.toFixed(2)}
          <span className="text-gray-400 font-normal"> / 5</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-slate-500 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// Generic mean-on-a-scale row, used by the new cards. `value` and `max`
// are interpreted on the natural scale of the underlying items
// (e.g. value 3.4 / max 5 for likert5; value 7.2 / max 10 for 0-10 scales).
// `min` defaults to 0; pass 1 for likert5 so a true minimum renders as an
// empty bar instead of 20%.
function MeanRow({
  label,
  value,
  min = 0,
  max,
  caption,
  inverted = false,
  decimals = 1,
}: {
  label: string;
  value: number | null;
  min?: number;
  max: number;
  caption?: string;
  /** True when high values indicate a problem — flips the green/red mapping. */
  inverted?: boolean;
  decimals?: number;
}) {
  if (value === null) {
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          <span className="text-sm text-gray-400">No answers</span>
        </div>
        {caption && <p className="text-xs text-gray-400 mt-0.5">{caption}</p>}
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = bandColor(value, min, max, inverted);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">
          {label}
          {inverted && (
            <span className="ml-2 text-xs text-gray-400 font-normal italic">
              ↓ lower is better
            </span>
          )}
        </span>
        <span className="text-sm font-semibold tabular-nums">
          {value.toFixed(decimals)}
          <span className="text-gray-400 font-normal"> / {max}</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption && <p className="text-xs text-gray-500">{caption}</p>}
    </div>
  );
}

function CohortRow({
  label,
  percentile,
  caption,
}: {
  label: string;
  percentile: number;
  caption: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <span className="text-sm font-semibold text-indigo-500">
          {percentile}th %ile
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div
          className="bg-indigo-400 h-2 rounded-full transition-all"
          style={{ width: `${percentile}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{caption}</p>
    </div>
  );
}

export default function ResultsDisplay({ token }: ResultsDisplayProps) {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [cohort, setCohort] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No token provided.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let pendingRetries = 0;
    const MAX_PENDING_RETRIES = 3;

    async function fetchResults() {
      try {
        const res = await fetch(`/api/results/${token}`);

        // 202 = scoring hasn't finished yet. Poll a few times.
        if (res.status === 202 && pendingRetries < MAX_PENDING_RETRIES) {
          pendingRetries += 1;
          setTimeout(() => !cancelled && fetchResults(), 1500);
          return;
        }

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            body.error ||
              (res.status === 404
                ? "We couldn't find results for this code. Double-check it and try again."
                : "We couldn't load your results. Please refresh in a moment.")
          );
        }

        if (!cancelled) setData(body as ResultsResponse);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchResults();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Separately fetch cohort data. 404 = flag off or not enough data — silent no-op.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cohort?token=${encodeURIComponent(token)}`);
        if (!res.ok) return; // 404 or 503 — no cohort card to show
        const body = (await res.json()) as CohortData;
        if (!cancelled) setCohort(body);
      } catch {
        // Silent — cohort is an enhancement, not required.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleCopyToken() {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading your results</span>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="h-20 bg-gray-100 rounded-lg animate-pulse mb-8" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="border border-gray-200 rounded-lg p-5 mb-4 animate-pulse"
          >
            <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
            <div className="h-3 w-full bg-gray-100 rounded mb-2" />
            <div className="h-3 w-1/2 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center" role="alert">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          We couldn&apos;t load your results
        </h2>
        <p className="text-gray-600 mb-6">{error || "No results found."}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }

  const {
    scores,
    section_founder_challenges,
    section_founder_stress,
    section_cofounder,
    section_life_outlook,
    section_ambition,
    section_burnout,
  } = data;

  // ─────────────────────────────────────────────────────────
  // Founder Challenges (V3, fc_*) → grouped themes
  // ─────────────────────────────────────────────────────────
  const itemScores: Record<string, number> = {};
  for (const [key, raw] of Object.entries(section_founder_challenges || {})) {
    if (!key.startsWith("fc_")) continue;
    if (raw === undefined || raw === null || raw === "") continue;
    const n =
      typeof raw === "string" ? CHALLENGE_VALUE_MAP[raw] : Number(raw);
    if (Number.isFinite(n)) itemScores[key] = n;
  }
  const challengeGroups = CHALLENGE_GROUPS.map((group) => {
    const answered = group.items
      .map((id) => ({ id, value: itemScores[id] }))
      .filter((x) => typeof x.value === "number") as Array<{
      id: string;
      value: number;
    }>;
    const avg =
      answered.length > 0
        ? answered.reduce((sum, x) => sum + x.value, 0) / answered.length
        : 0;
    // Reverse-coded: lowest value = highest reported challenge.
    const worst = answered.length
      ? answered.reduce((acc, x) => (x.value < acc.value ? x : acc))
      : null;
    return {
      ...group,
      answered: answered.length,
      avg,
      worst: worst ? { label: CHALLENGE_LABELS[worst.id] ?? worst.id } : null,
    };
  });
  const hasAnyChallengeData = challengeGroups.some((g) => g.answered > 0);

  // Pre-V3 legacy fallback for older tokens.
  const legacyStressorEntries = !hasAnyChallengeData
    ? Object.entries(section_founder_stress || {})
        .filter(([key]) => key.startsWith("fs_"))
        .map(([key, value]) => ({
          key,
          label: STRESS_LABELS[key] || key,
          value:
            typeof value === "string"
              ? (STRESS_VALUE_MAP[value] ?? 0)
              : Number(value),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  // ─────────────────────────────────────────────────────────
  // Cofounder Relationship (8 likert5 + 1 scale 0-10)
  // ─────────────────────────────────────────────────────────
  const cf = section_cofounder ?? null;
  const cfOverall = cf && typeof cf["cf_overall_health"] === "number"
    ? (cf["cf_overall_health"] as number)
    : cf && typeof cf["cf_overall_health"] === "string" && cf["cf_overall_health"] !== ""
      ? Number(cf["cf_overall_health"])
      : null;
  // Four cofounder subscales (renamed 2026-05-05). Each pairs two of the
  // eight likert items; together they exhaust the section's likert content.
  const cfCompatibleVision = meanOf(
    cf,
    ["cf_aligned_vision", "cf_quality_standards"],
    AGREE_5_VALUES
  );
  const cfCalibratedTeamwork = meanOf(
    cf,
    ["cf_roles", "cf_fair_division"],
    AGREE_5_VALUES
  );
  const cfProductiveConflict = meanOf(
    cf,
    ["cf_work_through", "cf_difficult_topics"],
    AGREE_5_VALUES
  );
  const cfSupportiveTrust = meanOf(
    cf,
    ["cf_trust_do", "cf_honest_doubts"],
    AGREE_5_VALUES
  );
  const hasCofounderData =
    cfOverall !== null ||
    cfCompatibleVision.answered > 0 ||
    cfCalibratedTeamwork.answered > 0 ||
    cfProductiveConflict.answered > 0 ||
    cfSupportiveTrust.answered > 0;

  // ─────────────────────────────────────────────────────────
  // Life Outlook (9 items, all 0-10 scale_0_10)
  // ─────────────────────────────────────────────────────────
  const lo = section_life_outlook ?? null;
  const loWellbeing = meanOf(lo, [
    "life_satisfaction",
    "life_happy",
    "life_worthwhile",
    "life_purpose",
  ]);
  const loDomains = meanOf(lo, [
    "life_relationships_satisfying",
    "life_physical_health",
    "life_mental_health",
  ]);
  const loFrustration = meanOf(lo, ["life_have_to", "life_alone"]);
  const hasLifeOutlookData =
    loWellbeing.answered > 0 || loDomains.answered > 0 || loFrustration.answered > 0;

  // ─────────────────────────────────────────────────────────
  // Ambition (drive intensity + Deci-Ryan PLOC + Kasser-Ryan)
  // ─────────────────────────────────────────────────────────
  const amb = section_ambition ?? null;
  const ambDrive = meanOf(
    amb,
    ["amb_ambitious", "amb_strive", "amb_challenging_goals"],
    AGREE_5_VALUES
  );
  const regAutonomous = meanOf(
    amb,
    ["reg_identified", "reg_integrated", "reg_intrinsic"],
    AGREE_5_VALUES
  );
  const regControlled = meanOf(
    amb,
    ["reg_external_avoid", "reg_external_approach", "reg_introjected"],
    AGREE_5_VALUES
  );
  const aspIntrinsic = meanOf(
    amb,
    ["asp_helping", "asp_self_knowledge"],
    IMPORTANCE_5_VALUES
  );
  const aspExtrinsic = meanOf(
    amb,
    ["asp_financial", "asp_admiration"],
    IMPORTANCE_5_VALUES
  );
  const hasAmbitionData =
    ambDrive.answered > 0 ||
    regAutonomous.answered > 0 ||
    regControlled.answered > 0 ||
    aspIntrinsic.answered > 0 ||
    aspExtrinsic.answered > 0;

  // ─────────────────────────────────────────────────────────
  // Burnout (MBI-GS, 7-pt frequency 0-6)
  // Efficacy items are reverseCoded for analysis, but we display
  // their raw mean labelled "Professional Efficacy" (higher = better)
  // since that matches respondents' lived reading of the items.
  // ─────────────────────────────────────────────────────────
  const bu = section_burnout ?? null;
  const buExhaustion = meanOf(
    bu,
    ["mbi_exhaust_1", "mbi_exhaust_2", "mbi_exhaust_3"],
    MBI_FREQ_VALUES
  );
  const buCynicism = meanOf(
    bu,
    ["mbi_cynicism_1", "mbi_cynicism_2", "mbi_cynicism_3"],
    MBI_FREQ_VALUES
  );
  const buEfficacy = meanOf(
    bu,
    ["mbi_efficacy_1", "mbi_efficacy_2", "mbi_efficacy_3"],
    MBI_FREQ_VALUES
  );
  const hasBurnoutData =
    buExhaustion.answered > 0 ||
    buCynicism.answered > 0 ||
    buEfficacy.answered > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <CrisisBanner show={scores.phq9.suicidal_ideation_flagged} />

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Results</h1>
      <p className="text-gray-500 text-sm mb-8">
        Survey completed on{" "}
        {/* created_at is a DATE (YYYY-MM-DD) per privacy migration 005.
            Slice the first 10 chars so we render the same date regardless
            of whether the DB row predates the migration (TIMESTAMPTZ) or
            post-dates it (DATE). Parse at local noon to avoid tz drift. */}
        {new Date(data.created_at.slice(0, 10) + "T12:00:00").toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        )}
      </p>

      {/* Token Display */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-8">
        <div className="flex items-start gap-2 mb-3">
          <span aria-hidden="true" className="text-amber-600 text-lg leading-none mt-0.5">🔑</span>
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">
              Save your access code
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              This code is the <strong>only way</strong> to view these results
              again. We don&apos;t store your email alongside your responses —
              they live in separate tables with no join key, so even we
              can&apos;t look you up by email. If you lose this code, your
              results are gone for good. Save it in a password manager or notes
              app.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <code className="bg-white border border-amber-300 rounded px-3 py-2 text-base font-mono font-semibold flex-1 truncate tracking-wide">
            {token}
          </code>
          <button
            onClick={handleCopyToken}
            className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-amber-700 mt-3">
          Tip: bookmark this page — it&apos;s also the only way back, since the
          confirmation email doesn&apos;t contain your code.
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────
          Cards below render in the same order as the survey itself,
          so respondents see them in the order they answered them:
          founder challenges → cofounder → life outlook → ambition →
          PHQ-9 → GAD-7 → MBI burnout → ASRS → AQ-10 → Dark Triad.
          ────────────────────────────────────────────────────────── */}

      {/* Founder Challenges (V3) grouped into themes, or legacy Stressors (V2 fallback) */}
      {hasAnyChallengeData ? (
        <ResultsCard title="Your Founder Challenges">
          <div className="space-y-5">
            {challengeGroups.map((group) => {
              const filled = group.answered > 0
                ? Math.max(0, Math.min(100, ((group.avg - 1) / 4) * 100))
                : 0;
              const color =
                group.answered > 0
                  ? bandColor(group.avg, 1, 5, false)
                  : "bg-gray-300";
              return (
                <div key={group.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {group.label}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {group.description}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400 tabular-nums">
                      {group.answered > 0 ? group.avg.toFixed(1) : "—"} / 5
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div
                      className={`${color} h-2 rounded-full transition-all`}
                      style={{ width: `${filled}%` }}
                    />
                  </div>
                  {group.worst ? (
                    <p className="text-xs text-gray-500">
                      Biggest challenge:{" "}
                      <span className="text-gray-700">{group.worst.label}</span>
                    </p>
                  ) : group.answered === 0 ? (
                    <p className="text-xs text-gray-400 italic">No answers in this theme.</p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Reverse-coded: <strong>higher = better</strong>. 5 / 5 means
            you reported no challenge in that theme; 1 / 5 means you marked
            every item there as a major challenge.
          </p>
        </ResultsCard>
      ) : legacyStressorEntries.length > 0 ? (
        <ResultsCard title="Your Top Founder Stressors">
          <div className="space-y-3">
            {legacyStressorEntries.map((entry) => (
              <div key={entry.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{entry.label}</span>
                  <span className="text-sm text-gray-400">{entry.value}/4</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${(entry.value / 4) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ResultsCard>
      ) : null}

      {/* Cofounder Relationship — skipped for solo founders, so empty section means nothing to show */}
      {hasCofounderData && (
        <ResultsCard title="Cofounder Relationship">
          <div className="space-y-4 mb-3">
            <MeanRow
              label="Overall relationship health"
              value={cfOverall}
              max={10}
              caption="Your single 0–10 rating from the end of the section."
            />
            <MeanRow
              label="Compatible Vision"
              value={cfCompatibleVision.mean}
              min={1}
              max={5}
              decimals={2}
              caption="Aligned on direction and shared standards for quality."
            />
            <MeanRow
              label="Calibrated Teamwork"
              value={cfCalibratedTeamwork.mean}
              min={1}
              max={5}
              decimals={2}
              caption="Clear roles & decision rights, fair division of labor."
            />
            <MeanRow
              label="Productive Conflict"
              value={cfProductiveConflict.mean}
              min={1}
              max={5}
              decimals={2}
              caption="Working through disagreement, raising hard topics without damage."
            />
            <MeanRow
              label="Supportive Trust"
              value={cfSupportiveTrust.mean}
              min={1}
              max={5}
              decimals={2}
              caption="Reliability and the freedom to be honest about doubts and mistakes."
            />
          </div>
          <p className="text-sm text-gray-500">
            Subscale scores are means of the underlying agreement items
            (1 = strongly disagree, 5 = strongly agree). Higher is better.
          </p>
        </ResultsCard>
      )}

      {/* Life Outlook (the merged "Outlook" section — all 0-10 items) */}
      {hasLifeOutlookData && (
        <ResultsCard title="Outlook">
          <div className="space-y-4 mb-3">
            <MeanRow
              label="Well-being (satisfaction · happiness · purpose)"
              value={loWellbeing.mean}
              max={10}
              decimals={1}
            />
            <MeanRow
              label="Life domains (relationships · physical · mental)"
              value={loDomains.mean}
              max={10}
              decimals={1}
            />
            <MeanRow
              label="Need-frustration (founder role)"
              value={loFrustration.mean}
              max={10}
              decimals={1}
              inverted
              caption="Higher = more frustration. Mean of two items: 'I have to' vs 'I want to', and 'I feel alone carrying this'."
            />
          </div>
          <p className="text-sm text-gray-500">
            All items are on a 0–10 scale. Well-being and life-domain bars
            read as &quot;higher is better&quot;; the need-frustration bar is
            inverted — high values flag autonomy/relatedness strain in the
            founder role.
          </p>
        </ResultsCard>
      )}

      {/* Ambition — drive intensity + Deci-Ryan regulation + Kasser-Ryan aspirations */}
      {hasAmbitionData && (
        <ResultsCard title="Ambition">
          <div className="space-y-4 mb-3">
            <MeanRow
              label="Drive intensity"
              value={ambDrive.mean}
              min={1}
              max={5}
              decimals={2}
              caption="Mean of three Hirschi/Spurk items (ambitious · strive · challenging goals)."
            />
            <MeanRow
              label="Autonomous regulation"
              value={regAutonomous.mean}
              min={1}
              max={5}
              decimals={2}
              caption="Identified · integrated · intrinsic — doing the work because it fits who you are."
            />
            <MeanRow
              label="Controlled regulation"
              value={regControlled.mean}
              min={1}
              max={5}
              decimals={2}
              inverted
              caption="External avoidance · external approach · introjected — doing it because of consequences, rewards, or guilt."
            />
            <MeanRow
              label="Intrinsic aspirations (helping · self-knowledge)"
              value={aspIntrinsic.mean}
              min={1}
              max={5}
              decimals={2}
            />
            <MeanRow
              label="Extrinsic aspirations (financial · admiration)"
              value={aspExtrinsic.mean}
              min={1}
              max={5}
              decimals={2}
            />
          </div>
          <p className="text-sm text-gray-500">
            The autonomous-vs-controlled split is the analytical centerpiece —
            high autonomous + low controlled is the Self-Determination Theory
            profile that predicts well-being independent of attainment.
          </p>
        </ResultsCard>
      )}

      {/* Depression */}
      <ResultsCard title="Depression Screening (PHQ-9)">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Score</span>
            <span className="font-semibold text-lg">{scores.phq9.score}/27</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${severityBarColor(scores.phq9.severity)}`}
              style={{ width: scoreBarWidth(scores.phq9.score, 27) }}
            />
          </div>
        </div>
        <p className="mb-1">
          Severity:{" "}
          <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${severityColor(scores.phq9.severity)}`}>
            {formatPHQ9Severity(scores.phq9.severity)}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          About {scores.phq9.general_pop_band_pct}% of the general population
          scores in the {formatPHQ9Severity(scores.phq9.severity).toLowerCase()}{" "}
          range.
        </p>
      </ResultsCard>

      {/* Anxiety */}
      <ResultsCard title="Anxiety Screening (GAD-7)">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Score</span>
            <span className="font-semibold text-lg">{scores.gad7.score}/21</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${severityBarColor(scores.gad7.severity)}`}
              style={{ width: scoreBarWidth(scores.gad7.score, 21) }}
            />
          </div>
        </div>
        <p className="mb-1">
          Severity:{" "}
          <span className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${severityColor(scores.gad7.severity)}`}>
            {formatGAD7Severity(scores.gad7.severity)}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          About {scores.gad7.general_pop_band_pct}% of the general population
          scores in the {formatGAD7Severity(scores.gad7.severity).toLowerCase()}{" "}
          range.
        </p>
      </ResultsCard>

      {/* Burnout (MBI-GS) */}
      {hasBurnoutData && (
        <ResultsCard title="Burnout (MBI-GS)">
          <div className="space-y-4 mb-3">
            <MeanRow
              label="Emotional exhaustion"
              value={buExhaustion.mean}
              max={6}
              decimals={1}
              inverted
              caption="How often you feel drained / used up / tired by work."
            />
            <MeanRow
              label="Cynicism (depersonalization)"
              value={buCynicism.mean}
              max={6}
              decimals={1}
              inverted
              caption="How often interest, enthusiasm, and meaning have eroded."
            />
            <MeanRow
              label="Professional efficacy"
              value={buEfficacy.mean}
              max={6}
              decimals={1}
              caption="How often you feel good at, exhilarated by, or accomplished in your work — higher is better."
            />
          </div>
          <p className="text-sm text-gray-500">
            MBI-GS scales each run 0 (Never) to 6 (Every day). High
            exhaustion + high cynicism + low efficacy is the burnout
            signature; isolated high exhaustion is more often plain overwork.
          </p>
        </ResultsCard>
      )}

      {/* ADHD traits */}
      <ResultsCard title="ADHD Traits Screening (ASRS)">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">
              Screening items met
            </span>
            <span className="font-semibold text-lg">
              {scores.asrs.items_flagged}/6
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all bg-slate-500"
              style={{
                width: scoreBarWidth(scores.asrs.items_flagged, 6),
              }}
            />
          </div>
        </div>
        <p className="mb-1">
          Threshold:{" "}
          <span className="inline-block px-2 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-700">
            {scores.asrs.above_threshold
              ? "Above (4+ of 6 items met)"
              : "Below (fewer than 4 items met)"}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          The ASRS-v1.1 screener flags an item when you answer in a high-frequency
          range (items 1–3: <em>Sometimes</em> or higher; items 4–6: <em>Often</em>{" "}
          or higher). Meeting <strong>4 or more out of 6</strong> is the cutoff
          that suggests further ADHD evaluation may be worthwhile. About{" "}
          {scores.asrs.general_pop_above_threshold_pct}% of the general
          population meets this threshold.
        </p>
      </ResultsCard>

      {/* Autism spectrum traits */}
      {scores.aq10 && scores.aq10.items_answered > 0 && (
        <ResultsCard title="Autism Spectrum Traits Screening (AQ-10)">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Score</span>
              <span className="font-semibold text-lg">
                {scores.aq10.score}/10
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all bg-slate-500"
                style={{ width: scoreBarWidth(scores.aq10.score, 10) }}
              />
            </div>
          </div>
          <p className="mb-1">
            Threshold:{" "}
            <span className="inline-block px-2 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-700">
              {scores.aq10.above_threshold
                ? "At or above (6+ of 10)"
                : "Below (fewer than 6)"}
            </span>
          </p>
          <p className="text-sm text-gray-500">
            The AQ-10 awards 1 point per item answered in the autism-trait
            direction. A score of <strong>6 or higher</strong> is the cutoff
            commonly used in adult primary care to suggest a referral for full
            autism assessment. This is a screening tool only, not a diagnosis.
          </p>
        </ResultsCard>
      )}

      {/* Dark Triad personality (Dirty Dozen) */}
      {scores.darkTriad && scores.darkTriad.items_answered > 0 && (
        <ResultsCard title="Personality (Dirty Dozen Dark Triad)">
          <div className="space-y-3 mb-3">
            <DarkTriadRow
              label="Machiavellianism"
              value={scores.darkTriad.machiavellianism}
            />
            <DarkTriadRow
              label="Psychopathy"
              value={scores.darkTriad.psychopathy}
            />
            <DarkTriadRow
              label="Narcissism"
              value={scores.darkTriad.narcissism}
            />
          </div>
          {scores.darkTriad.composite !== null && (
            <p className="text-sm text-gray-700 mb-1">
              Composite (mean of all 12 items):{" "}
              <strong>
                {scores.darkTriad.composite.toFixed(2)}
              </strong>
              <span className="text-gray-400"> / 5</span>
            </p>
          )}
          <p className="text-sm text-gray-500">
            Each subscale is the mean of 4 items rated 1 (strongly disagree) to
            5 (strongly agree). Higher scores reflect stronger expression of the
            trait. Dark Triad traits aren&apos;t inherently pathological — modest
            elevations are common and can be adaptive in entrepreneurial settings.
          </p>
        </ResultsCard>
      )}

      {/* Founder cohort comparison — only shown when flag is on */}
      {cohort && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2 border-b pb-2">
            Compared to other founders
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Based on {cohort.N.toLocaleString()} founder responses to this
            survey.
          </p>
          <ResultsCard title="How you compare (founder cohort)">
            <div className="space-y-4">
              <CohortRow
                label="Depression (PHQ-9)"
                percentile={cohort.phq9.percentile}
                caption={`Founder cohort average: ${cohort.phq9.mean} / 27`}
              />
              <CohortRow
                label="Anxiety (GAD-7)"
                percentile={cohort.gad7.percentile}
                caption={`Founder cohort average: ${cohort.gad7.mean} / 21`}
              />
              <CohortRow
                label="ADHD traits (ASRS items met)"
                percentile={cohort.asrs.percentile}
                caption={`${cohort.asrs.above_threshold_pct}% of founders meet the threshold`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Percentiles here are empirical — computed from real founder
              responses, not interpolated. Higher percentile = your score is
              higher than that fraction of founders.
            </p>
          </ResultsCard>
        </div>
      )}

      {/* What this means */}
      <div className="mt-8 p-5 bg-indigo-50 border border-indigo-100 rounded-lg">
        <h3 className="font-semibold text-indigo-900 mb-2">What do these scores mean?</h3>
        <ul className="text-sm text-indigo-800 space-y-2">
          <li><strong>Founder challenges</strong> are common pressure points. High scores don&apos;t mean something is wrong — they mean you&apos;re carrying a lot.</li>
          <li><strong>Cofounder relationship</strong> subscales come from the agreement items at the end of that section. The 0–10 overall reading is your single subjective rating; the subscales help locate where strain (if any) is concentrated.</li>
          <li><strong>Outlook</strong> bundles well-being, life domains, and founder-specific need-frustration. Need-frustration items are inverted — high values flag autonomy/relatedness strain in the role.</li>
          <li><strong>Ambition</strong> separates how hard you&apos;re pushing (drive intensity) from <em>why</em> (autonomous vs controlled regulation, intrinsic vs extrinsic aspirations). The motivational profile predicts well-being more than how hard you push.</li>
          <li><strong>PHQ-9</strong> is a validated depression screener (0–27). 10+ suggests moderate depression worth discussing with a professional.</li>
          <li><strong>GAD-7</strong> measures generalized anxiety (0–21). 10+ suggests moderate anxiety that may benefit from support.</li>
          <li><strong>MBI-GS</strong> measures burnout across exhaustion, cynicism, and professional efficacy on 0–6 frequency scales. The full burnout signature is high exhaustion + high cynicism + low efficacy.</li>
          <li><strong>ASRS</strong> screens for <strong>ADHD traits</strong>. 4 or more of 6 items meeting their frequency threshold suggests further evaluation may be worthwhile — many founders have undiagnosed ADHD.</li>
          <li><strong>AQ-10</strong> screens for <strong>autism spectrum traits</strong> (0–10). 6+ is the threshold typically used to recommend a full autism assessment. Trait-level signal — not a diagnosis.</li>
          <li><strong>Dirty Dozen</strong> measures three Dark Triad traits (Machiavellianism, Psychopathy, Narcissism), each on a 1–5 scale. Modest elevations are common and not inherently pathological.</li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <a
          href={`/email?token=${token}`}
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Get the Full Report & Explore Resources
        </a>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 leading-relaxed">
        <p>
          <strong>Disclaimer:</strong> This survey is a screening tool for
          informational purposes only. It does not constitute a medical
          diagnosis. The results are based on validated screening instruments but
          should not replace a comprehensive evaluation by a qualified mental
          health professional. If you are concerned about your mental health,
          please consult a licensed clinician.
        </p>
      </div>
    </div>
  );
}
