"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Disclosure from "@/components/Disclosure";

// localStorage key the survey reads on mount to seed the company section.
// Mirrors fmh_survey_draft format in app/survey/page.tsx.
const FOUNDER_STATUS_SEED_KEY = "fmh_founder_status_seed";

type FounderStatus = "current" | "past";

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [founderStatus, setFounderStatus] = useState<FounderStatus | "">("");

  const canContinue = agreed && founderStatus !== "";

  function handleStart() {
    if (founderStatus !== "") {
      try {
        window.localStorage.setItem(FOUNDER_STATUS_SEED_KEY, founderStatus);
      } catch {
        // Quota / private mode — fail silently; we'll just not seed.
      }
    }
    router.push("/survey");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Before you begin</h1>

      <p className="text-gray-700 leading-relaxed mb-4">
        This is a screening tool, not a diagnosis. It takes about 10 minutes
        and is fully anonymous. Every question is optional.
      </p>
      <p className="text-gray-700 leading-relaxed mb-8">
        Some questions ask about mood and self-harm. If any of it feels unsafe,
        you can stop at any time — crisis resources appear where relevant.
      </p>

      <div className="space-y-3 mb-10">
        <Disclosure summary="What you'll be asked">
          <p>
            A few demographic questions, validated clinical screeners (PHQ-9,
            GAD-7, ASRS, AQ-10, MBI-GS), and founder-specific sections on
            challenges, ambition, cofounder relationship, personality,
            medication, substance use, and help-seeking history. One optional
            open-ended reflection at the end.
          </p>
          <p>
            Every item is optional. Skip anything you don&apos;t want to
            answer.
          </p>
        </Disclosure>

        <Disclosure summary="How your responses are handled">
          <p>
            Responses are tied to a random access code, not your identity. If
            you leave an email afterward, it&apos;s stored in a separate table
            with no link back to your answers. You&apos;ll receive the access
            code at the end — save it, because it&apos;s the only way back to
            your results.
          </p>
        </Disclosure>
      </div>

      <fieldset className="mb-6">
        <legend className="text-sm font-medium text-gray-900 mb-3">
          Are you a current or past founder?
        </legend>
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="founder_status"
              value="current"
              checked={founderStatus === "current"}
              onChange={() => setFounderStatus("current")}
              className="mt-1 h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-gray-700 text-sm">
              <strong>Current founder.</strong> I&apos;m actively working on a
              startup right now.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="founder_status"
              value="past"
              checked={founderStatus === "past"}
              onChange={() => setFounderStatus("past")}
              className="mt-1 h-4 w-4 border-gray-300 text-gray-900 focus:ring-gx-500"
            />
            <span className="text-gray-700 text-sm">
              <strong>Past founder.</strong> I&apos;ve founded or co-founded a
              startup before, but I&apos;m not actively running one now.
            </span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-4 mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          <span className="text-gray-700 text-sm">
            I understand this is a screening tool, not a diagnosis, and I agree
            to participate.
          </span>
        </label>
      </div>

      <button
        onClick={handleStart}
        disabled={!canContinue}
        className={`w-full py-3 rounded-lg font-medium text-lg transition-colors ${
          canContinue
            ? "bg-gray-900 text-white hover:bg-gray-700 cursor-pointer"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        Start the Survey
      </button>
    </div>
  );
}
