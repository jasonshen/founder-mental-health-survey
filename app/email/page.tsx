"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function EmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [wantsReport, setWantsReport] = useState(true);
  const [wantsCoaching, setWantsCoaching] = useState(false);
  const [wantsRetreat, setWantsRetreat] = useState(false);
  const [wantsPlantMedicine, setWantsPlantMedicine] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          wants_report: wantsReport,
          wants_coaching: wantsCoaching,
          wants_retreat: wantsRetreat,
          wants_plant_medicine: wantsPlantMedicine,
          wants_updates: wantsUpdates,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 text-lg">
          No token provided. Please check your link.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        <p className="text-gray-600 mb-2">
          Your email has been submitted successfully.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {wantsReport && "We'll send your full report shortly. "}
          We'll be in touch about the resources you expressed interest in.
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 inline-block">
          <p className="text-sm text-gray-500 mb-1">
            Your anonymous token:
          </p>
          <code className="text-sm font-mono font-medium">{token}</code>
        </div>
        <div>
          <a
            href={`/results?token=${token}`}
            className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            View Your Results
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Stay Connected
      </h1>
      <p className="text-gray-500 mb-8">
        Leave your email to get your full report and learn about resources for
        founder mental health. We respect your privacy and will never share your
        email.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">
            I'm interested in: (check all that apply)
          </p>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsReport}
                onChange={(e) => setWantsReport(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <div>
                <span className="text-gray-700 text-sm font-medium">
                  Full report of my results
                </span>
                <p className="text-xs text-gray-400">
                  A detailed PDF breakdown of your scores with context and
                  recommendations.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsCoaching}
                onChange={(e) => setWantsCoaching(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <div>
                <span className="text-gray-700 text-sm font-medium">
                  Coaching resources for founders
                </span>
                <p className="text-xs text-gray-400">
                  Curated list of coaches and therapists who specialize in
                  working with startup founders.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsRetreat}
                onChange={(e) => setWantsRetreat(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <div>
                <span className="text-gray-700 text-sm font-medium">
                  In-person founder retreat
                </span>
                <p className="text-xs text-gray-400">
                  Small-group retreats designed for founders to rest, reflect,
                  and connect with peers.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsPlantMedicine}
                onChange={(e) => setWantsPlantMedicine(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <div>
                <span className="text-gray-700 text-sm font-medium">
                  Plant medicine / psychedelic-assisted therapy
                </span>
                <p className="text-xs text-gray-400">
                  Information about legal, clinically supervised psychedelic-assisted
                  therapy programs.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantsUpdates}
                onChange={(e) => setWantsUpdates(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <div>
                <span className="text-gray-700 text-sm font-medium">
                  Research updates
                </span>
                <p className="text-xs text-gray-400">
                  Receive the aggregate findings from this survey when
                  published, plus founder mental health research.
                </p>
              </div>
            </label>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg font-medium text-lg transition-colors ${
            submitting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-gray-700 cursor-pointer"
          }`}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <a
          href={`/results?token=${token}`}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip and return to results
        </a>
      </div>
    </div>
  );
}

export default function EmailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      }
    >
      <EmailContent />
    </Suspense>
  );
}
