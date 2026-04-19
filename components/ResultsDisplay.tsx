"use client";

import { useEffect, useState } from "react";
import type {
  ResultsResponse,
  PHQ9Severity,
  GAD7Severity,
} from "@/lib/types";
import CrisisBanner from "./CrisisBanner";
import ResultsCard from "./ResultsCard";

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
    case "none": return "text-green-700 bg-green-50";
    case "mild": return "text-yellow-700 bg-yellow-50";
    case "moderate": return "text-orange-700 bg-orange-50";
    case "moderately_severe": return "text-red-600 bg-red-50";
    case "severe": return "text-red-800 bg-red-100";
  }
}

function severityBarWidth(severity: PHQ9Severity | GAD7Severity): string {
  switch (severity) {
    case "none": return "20%";
    case "mild": return "40%";
    case "moderate": return "60%";
    case "moderately_severe": return "80%";
    case "severe": return "100%";
  }
}

function severityBarColor(severity: PHQ9Severity | GAD7Severity): string {
  switch (severity) {
    case "none": return "bg-green-500";
    case "mild": return "bg-yellow-500";
    case "moderate": return "bg-orange-500";
    case "moderately_severe": return "bg-red-500";
    case "severe": return "bg-red-700";
  }
}

interface ResultsDisplayProps {
  token: string;
}

export default function ResultsDisplay({ token }: ResultsDisplayProps) {
  const [data, setData] = useState<ResultsResponse | null>(null);
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

  const { scores, section_founder_stress } = data;

  // Parse stressor data and sort by severity
  const stressorEntries = Object.entries(section_founder_stress || {})
    .filter(([key]) => key.startsWith("fs_"))
    .map(([key, value]) => ({
      key,
      label: STRESS_LABELS[key] || key,
      value: typeof value === "string" ? (STRESS_VALUE_MAP[value] ?? 0) : Number(value),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <CrisisBanner show={scores.phq9.suicidal_ideation_flagged} />

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Results</h1>
      <p className="text-gray-500 text-sm mb-8">
        Survey completed on{" "}
        {new Date(data.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Token Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-gray-600 mb-2">
          Your anonymous token (save this to access your results later):
        </p>
        <div className="flex items-center gap-3">
          <code className="bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-mono flex-1 truncate">
            {token}
          </code>
          <button
            onClick={handleCopyToken}
            className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

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
              style={{ width: severityBarWidth(scores.phq9.severity) }}
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
          Your score is higher than {scores.phq9.percentile_general}% of the general population.
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
              style={{ width: severityBarWidth(scores.gad7.severity) }}
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
          Your score is higher than {scores.gad7.percentile_general}% of the general population.
        </p>
      </ResultsCard>

      {/* ADHD */}
      <ResultsCard title="ADHD Screening (ASRS)">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Items flagged</span>
            <span className="font-semibold text-lg">{scores.asrs.items_flagged}/6</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                scores.asrs.above_threshold ? "bg-orange-500" : "bg-green-500"
              }`}
              style={{ width: `${(scores.asrs.items_flagged / 6) * 100}%` }}
            />
          </div>
        </div>
        <p className="mb-1">
          Threshold:{" "}
          <span
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${
              scores.asrs.above_threshold
                ? "bg-orange-100 text-orange-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {scores.asrs.above_threshold ? "Above (4+ items)" : "Below"}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          Your score is higher than {scores.asrs.percentile_general}% of the general population.
        </p>
      </ResultsCard>

      {/* Founder Stress */}
      <ResultsCard title="Your Top Founder Stressors">
        {stressorEntries.length > 0 ? (
          <div className="space-y-3">
            {stressorEntries.map((entry) => (
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
        ) : (
          <p className="text-sm text-gray-400">No stressor data available.</p>
        )}
      </ResultsCard>

      {/* What this means */}
      <div className="mt-8 p-5 bg-indigo-50 border border-indigo-100 rounded-lg">
        <h3 className="font-semibold text-indigo-900 mb-2">What do these scores mean?</h3>
        <ul className="text-sm text-indigo-800 space-y-2">
          <li><strong>PHQ-9</strong> is a validated depression screener. Scores of 10+ suggest moderate depression worth discussing with a professional.</li>
          <li><strong>GAD-7</strong> measures generalized anxiety. Scores of 10+ suggest moderate anxiety that may benefit from support.</li>
          <li><strong>ASRS</strong> screens for ADHD traits. 4+ flagged items suggest further evaluation may be worthwhile — many founders have undiagnosed ADHD.</li>
          <li><strong>Founder stressors</strong> are common pressure points. High scores here don't mean something is wrong — they mean you're carrying a lot.</li>
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
