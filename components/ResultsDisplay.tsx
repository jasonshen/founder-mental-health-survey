"use client";

import { useEffect, useState } from "react";
import type {
  ResultsResponse,
  PopulationComparison,
  PHQ9Severity,
  GAD7Severity,
} from "@/lib/types";
import CrisisBanner from "./CrisisBanner";
import ResultsCard from "./ResultsCard";

function formatComparison(comparison: PopulationComparison): string {
  switch (comparison) {
    case "below_average":
      return "Below Average";
    case "average":
      return "Average";
    case "above_average":
      return "Above Average";
  }
}

function formatPHQ9Severity(severity: PHQ9Severity): string {
  switch (severity) {
    case "none":
      return "None/Minimal";
    case "mild":
      return "Mild";
    case "moderate":
      return "Moderate";
    case "moderately_severe":
      return "Moderately Severe";
    case "severe":
      return "Severe";
  }
}

function formatGAD7Severity(severity: GAD7Severity): string {
  switch (severity) {
    case "none":
      return "None/Minimal";
    case "mild":
      return "Mild";
    case "moderate":
      return "Moderate";
    case "severe":
      return "Severe";
  }
}

function severityColor(severity: PHQ9Severity | GAD7Severity): string {
  switch (severity) {
    case "none":
      return "text-green-700 bg-green-50";
    case "mild":
      return "text-yellow-700 bg-yellow-50";
    case "moderate":
      return "text-orange-700 bg-orange-50";
    case "moderately_severe":
      return "text-red-600 bg-red-50";
    case "severe":
      return "text-red-800 bg-red-100";
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

    async function fetchResults() {
      try {
        const res = await fetch(`/api/results/${token}`);
        if (!res.ok) {
          throw new Error("Failed to load results. Please check your token.");
        }
        const json: ResultsResponse = await res.json();
        setData(json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [token]);

  function handleCopyToken() {
    navigator.clipboard.writeText(token).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Loading your results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 text-lg">{error || "No results found."}</p>
      </div>
    );
  }

  const { scores, section_founder_stress, section_treatment } = data;

  // Get top 3 highest-rated stressors
  const stressorEntries = Object.entries(section_founder_stress)
    .filter(([, value]) => typeof value === "number" || typeof value === "string")
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/^fs_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      value: Number(value),
    }))
    .filter((entry) => !isNaN(entry.value))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  // Treatment summary
  const therapyStatus = section_treatment.treatment_therapy;
  const coachStatus = section_treatment.treatment_coach;
  const medicationStatus = section_treatment.treatment_medication;
  const barriers = section_treatment.treatment_barriers;

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

      {/* Part 1: Your Profile */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">
        Your Profile
      </h2>

      <ResultsCard title="ADHD Screening (ASRS)">
        <p className="mb-1">
          <span className="font-medium">{scores.asrs.items_flagged} of 6</span>{" "}
          items flagged
        </p>
        <p className="mb-1">
          Threshold:{" "}
          <span
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${
              scores.asrs.above_threshold
                ? "bg-orange-100 text-orange-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {scores.asrs.above_threshold ? "Above" : "Below"}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          Percentile (general population): {scores.asrs.percentile_general}%
        </p>
      </ResultsCard>

      <ResultsCard title="Autism Screening (AQ-10)">
        <p className="mb-1">
          Score: <span className="font-medium">{scores.aq10.score}/10</span>
        </p>
        <p className="mb-1">
          Threshold:{" "}
          <span
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${
              scores.aq10.above_threshold
                ? "bg-orange-100 text-orange-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {scores.aq10.above_threshold ? "Above" : "Below"}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          Percentile (general population): {scores.aq10.percentile_general}%
        </p>
      </ResultsCard>

      <ResultsCard title="Dark Triad (SD3)">
        <div className="space-y-2">
          {(
            [
              ["Machiavellianism", scores.sd3.machiavellianism],
              ["Narcissism", scores.sd3.narcissism],
              ["Psychopathy", scores.sd3.psychopathy],
            ] as const
          ).map(([label, sub]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm">{label}</span>
              <span className="text-sm">
                <span className="font-medium">{sub.mean.toFixed(2)}</span>
                <span className="text-gray-400 mx-1">&mdash;</span>
                <span className="text-gray-500">
                  {formatComparison(sub.comparison_to_population)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </ResultsCard>

      {/* Part 2: Your Current State */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8 border-b pb-2">
        Your Current State
      </h2>

      <ResultsCard title="Depression (PHQ-9)">
        <p className="mb-1">
          Score: <span className="font-medium">{scores.phq9.score}/27</span>
          <span className="mx-1">&mdash;</span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${severityColor(
              scores.phq9.severity
            )}`}
          >
            {formatPHQ9Severity(scores.phq9.severity)}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          Percentile (general population): {scores.phq9.percentile_general}%
        </p>
      </ResultsCard>

      <ResultsCard title="Anxiety (GAD-7)">
        <p className="mb-1">
          Score: <span className="font-medium">{scores.gad7.score}/21</span>
          <span className="mx-1">&mdash;</span>
          <span
            className={`inline-block px-2 py-0.5 rounded text-sm font-medium ${severityColor(
              scores.gad7.severity
            )}`}
          >
            {formatGAD7Severity(scores.gad7.severity)}
          </span>
        </p>
        <p className="text-sm text-gray-500">
          Percentile (general population): {scores.gad7.percentile_general}%
        </p>
      </ResultsCard>

      <ResultsCard title="Top Founder Stressors">
        {stressorEntries.length > 0 ? (
          <ol className="list-decimal list-inside space-y-1">
            {stressorEntries.map((entry) => (
              <li key={entry.key} className="text-sm">
                {entry.label}{" "}
                <span className="text-gray-400">({entry.value}/5)</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-400">No stressor data available.</p>
        )}
      </ResultsCard>

      {/* Part 3: Your Treatment Landscape */}
      <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8 border-b pb-2">
        Your Treatment Landscape
      </h2>

      <ResultsCard title="Current Treatment">
        <div className="space-y-1 text-sm">
          <p>
            Therapy:{" "}
            <span className="font-medium">
              {therapyStatus === "yes" || therapyStatus === true
                ? "Yes"
                : "No"}
            </span>
          </p>
          <p>
            Coach:{" "}
            <span className="font-medium">
              {coachStatus === "yes" || coachStatus === true ? "Yes" : "No"}
            </span>
          </p>
          <p>
            Medication:{" "}
            <span className="font-medium">
              {medicationStatus === "yes" || medicationStatus === true
                ? "Yes"
                : "No"}
            </span>
          </p>
        </div>
      </ResultsCard>

      <ResultsCard title="Barriers to Treatment">
        {barriers ? (
          Array.isArray(barriers) ? (
            <ul className="list-disc list-inside space-y-1 text-sm">
              {barriers.map((b, i) => (
                <li key={i}>{String(b)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">{String(barriers)}</p>
          )
        ) : (
          <p className="text-sm text-gray-400">No barriers reported.</p>
        )}
      </ResultsCard>

      {/* CTA */}
      <div className="mt-8 text-center">
        <a
          href={`/email?token=${token}`}
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
        >
          Get Your Full Report via Email
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
