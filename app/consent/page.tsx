"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Disclosure from "@/components/Disclosure";

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  const canContinue = agreed && isFounder;

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

      <div className="space-y-4 mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFounder}
            onChange={(e) => setIsFounder(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          <span className="text-gray-700 text-sm">
            I am currently a founder or co-founder of a startup, or have been
            in the past.
          </span>
        </label>

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
        onClick={() => router.push("/survey")}
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
