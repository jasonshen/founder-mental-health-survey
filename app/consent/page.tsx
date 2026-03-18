"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isFounder, setIsFounder] = useState(false);

  const canContinue = agreed && isFounder;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Before You Begin
      </h1>

      <div className="space-y-4 text-gray-700 leading-relaxed mb-8">
        <p>
          Thank you for your interest in the Founder Mental Health Survey. Before
          you proceed, please read the following information carefully.
        </p>

        <p>
          <strong>Purpose:</strong> This survey is a screening tool designed to
          help startup founders better understand their mental health. It is not
          a diagnostic tool and does not replace professional medical advice,
          diagnosis, or treatment.
        </p>

        <p>
          <strong>What to expect:</strong> You will be asked questions from
          several validated clinical screening instruments covering topics
          including mood, anxiety, attention, social communication, personality
          traits, founder-specific stressors, and treatment history. The survey
          takes approximately 10-15 minutes.
        </p>

        <p>
          <strong>Confidentiality:</strong> Your responses are stored
          anonymously. You will receive a unique token to access your results. No
          personally identifiable information is collected during the survey. You
          may optionally provide your email afterward to receive a copy of your
          results.
        </p>

        <p>
          <strong>Risks:</strong> Some questions ask about sensitive topics
          including mood, self-harm, and psychological traits. If any questions
          cause distress, you may stop the survey at any time. Crisis resources
          are provided in your results if needed.
        </p>

        <p>
          <strong>Voluntary participation:</strong> Your participation is
          entirely voluntary. You may exit the survey at any point without
          consequence.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          <span className="text-gray-700 text-sm">
            I have read and understand the information above, and I agree to
            participate in this survey.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFounder}
            onChange={(e) => setIsFounder(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          <span className="text-gray-700 text-sm">
            I am currently a founder or co-founder of a startup or early-stage
            company, or have been in the past.
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
        Continue
      </button>
    </div>
  );
}
