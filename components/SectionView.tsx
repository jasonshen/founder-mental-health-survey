"use client";

import { useState, type ReactNode } from "react";

import type { AllScores, SectionId, SurveyResponses } from "@/lib/types";
import {
  SECTION_SUBSCALES,
  subscaleMeansForRow,
  percentileRank,
  type SectionCount,
} from "@/lib/aggregates";

const SECTION_LABEL: Partial<Record<SectionId, string>> = {
  founder_challenges: "founder challenges",
  cofounder: "cofounder relationship",
  life_outlook: "outlook",
  ambition: "ambition",
  depression: "depression",
  anxiety: "anxiety",
  burnout: "burnout",
  adhd: "ADHD traits",
  autism: "autism traits",
  dark_triad: "personality",
};

// Footnote shown under sections that are reverse-coded for display.
// Right now only founder_challenges shows higher = better; everything else
// uses the natural scale direction.
const FOOTNOTES: Partial<Record<SectionId, string>> = {
  founder_challenges:
    "Section is reverse-coded — higher = less challenge reported. A higher percentile means you reported less challenge than most founders.",
};

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

function pctOnScale(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

function CollectingNote({
  section,
  sectionId,
}: {
  section: SectionCount;
  sectionId: SectionId;
}) {
  const label = SECTION_LABEL[sectionId] ?? sectionId;
  const progressPct = Math.min(
    100,
    Math.round((section.n_total / (section.n_total + section.needed)) * 100)
  );
  return (
    <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-gray-700">
          Comparison data is collecting
        </span>
        <span className="tabular-nums text-gray-500">
          {section.n_total} / {section.n_total + section.needed}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5">
        <div
          className="bg-gray-400 h-1.5 rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="leading-relaxed">
        We&apos;ll show how you compare to other founders on{" "}
        <strong>{label}</strong> once we&apos;ve collected{" "}
        <strong>{section.needed}</strong> more response
        {section.needed === 1 ? "" : "s"} for this section.
      </p>
    </div>
  );
}

function Toggle({
  view,
  setView,
}: {
  view: "yours" | "compare";
  setView: (v: "yours" | "compare") => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-0.5 mb-4 text-xs font-medium">
      <button
        type="button"
        onClick={() => setView("yours")}
        aria-pressed={view === "yours"}
        className={`px-3 py-1 rounded-full transition-colors ${
          view === "yours"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Your scores
      </button>
      <button
        type="button"
        onClick={() => setView("compare")}
        aria-pressed={view === "compare"}
        className={`px-3 py-1 rounded-full transition-colors inline-flex items-center gap-1.5 ${
          view === "compare"
            ? "bg-white text-indigo-700 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Compare to founders
        {view === "yours" && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
          />
        )}
      </button>
    </div>
  );
}

function DistroRow({
  label,
  pct,
  mine,
  median,
  p25,
  p75,
  min,
  max,
  inverted,
  decimals,
}: {
  label: string;
  pct: number;
  mine: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  inverted: boolean;
  decimals: number;
}) {
  const minePctPos = pctOnScale(mine, min, max);
  const medianPctPos = pctOnScale(median, min, max);
  const p25Pos = pctOnScale(p25, min, max);
  const p75Pos = pctOnScale(p75, min, max);
  const diff = mine - median;
  const direction =
    Math.abs(diff) < 0.05
      ? "right at the founder median"
      : diff > 0
        ? `above the founder median (${median.toFixed(decimals)})`
        : `below the founder median (${median.toFixed(decimals)})`;
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
        <span className="text-xs font-semibold text-indigo-700 tabular-nums">
          {ordinal(pct)} percentile
        </span>
      </div>
      <div className="relative h-6">
        <span className="absolute left-0 top-0 text-[10px] text-gray-400 tabular-nums">
          {min}
        </span>
        <span className="absolute right-0 top-0 text-[10px] text-gray-400 tabular-nums">
          {max}
        </span>
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300 -translate-y-1/2" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 bg-indigo-100 rounded-sm"
          style={{ left: `${p25Pos}%`, width: `${p75Pos - p25Pos}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 w-px h-3 -translate-y-1/2 -translate-x-1/2 bg-indigo-500"
          style={{ left: `${medianPctPos}%` }}
          aria-label={`Founder median: ${median.toFixed(2)}`}
        />
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white -translate-y-1/2 -translate-x-1/2 shadow-sm"
          style={{ left: `${minePctPos}%` }}
          aria-label={`You: ${mine.toFixed(2)}`}
        />
      </div>
      <p className="text-xs text-gray-500">
        Your {mine.toFixed(decimals)} sits {direction}.
      </p>
    </div>
  );
}

function SubscalesComparison({
  sectionId,
  section,
  responses,
  scores,
}: {
  sectionId: SectionId;
  section: SectionCount;
  responses?: SurveyResponses | null;
  scores?: AllScores | null;
}) {
  const subscales = SECTION_SUBSCALES[sectionId];
  if (
    !subscales ||
    !section.distributions ||
    section.distributions.type !== "subscales"
  ) {
    return null;
  }
  // Items-based subscales need the section JSON cell; score-based subscales
  // need the precomputed scores blob. We bail only when both are missing AND
  // the section has any subscale that requires the missing source.
  const needsResponses = subscales.some((s) => s.items && !s.scoreField);
  const needsScores = subscales.some((s) => s.scoreField);
  if (needsResponses && !responses) return null;
  if (needsScores && !scores) return null;
  const myMeans = subscaleMeansForRow(responses, scores, subscales);
  const byId = new Map(section.distributions.groups.map((g) => [g.id, g]));

  const rows = subscales
    .map((s) => {
      const mine = myMeans[s.id];
      const cohort = byId.get(s.id);
      if (mine === null || !cohort || cohort.values.length === 0) return null;
      // For inverted subscales, "high percentile" naturally maps to "doing
      // worse than most founders." We don't flip the percentile here — we
      // surface the inversion via the row label so the reader can interpret
      // it correctly.
      return {
        id: s.id,
        label: cohort.label,
        pct: percentileRank(cohort.values, mine),
        mine,
        median: cohort.median,
        p25: cohort.p25,
        p75: cohort.p75,
        min: cohort.min,
        max: cohort.max,
        inverted: cohort.inverted,
        // Likert subscales (max 5 or 6) want 2 decimals to show fine
        // movement; 0-10 scales are coarser and read better with 1.
        decimals: cohort.max <= 6 ? 2 : 1,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length === 0) return null;

  const footnote = FOOTNOTES[sectionId];

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Based on {section.n_total} founder responses.
      </p>
      <div className="space-y-4">
        {rows.map((r) => (
          <DistroRow
            key={r.id}
            label={r.label}
            pct={r.pct}
            mine={r.mine}
            median={r.median}
            p25={r.p25}
            p75={r.p75}
            min={r.min}
            max={r.max}
            inverted={r.inverted}
            decimals={r.decimals}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-white shadow-sm" />
          You
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-px h-3 bg-indigo-500" />
          Founder median
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-1.5 bg-indigo-100 rounded-sm" />
          Middle 50% of founders
        </span>
      </div>
      {footnote && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">{footnote}</p>
      )}
    </div>
  );
}

interface Props {
  sectionId: SectionId;
  section: SectionCount | undefined;
  responses?: SurveyResponses | null;
  /** Precomputed scores blob — required for score-based subscale rows. */
  scores?: AllScores | null;
  /** The respondent's own scores view — typically the rating bars + notes. */
  children: ReactNode;
}

/**
 * Wraps each section card's body and adds a "Your scores / Compare to
 * founders" toggle when (a) comparison data exists for this section and
 * (b) the section has crossed the response-count threshold. Sections that
 * aren't ready fall through to the user's view + a small "collecting" note.
 */
export default function SectionView({
  sectionId,
  section,
  responses,
  scores,
  children,
}: Props) {
  const [view, setView] = useState<"yours" | "compare">("yours");
  const canCompare =
    section?.ready === true && SECTION_SUBSCALES[sectionId] !== undefined;

  if (!section) return <>{children}</>;

  if (!canCompare) {
    return (
      <>
        {children}
        {!section.ready && SECTION_SUBSCALES[sectionId] !== undefined && (
          <CollectingNote section={section} sectionId={sectionId} />
        )}
      </>
    );
  }

  return (
    <>
      <Toggle view={view} setView={setView} />
      {view === "yours" ? (
        children
      ) : (
        <SubscalesComparison
          sectionId={sectionId}
          section={section}
          responses={responses}
          scores={scores}
        />
      )}
    </>
  );
}
