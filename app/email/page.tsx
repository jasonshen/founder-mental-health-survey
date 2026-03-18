"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function EmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [wantsReport, setWantsReport] = useState(true);
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
        <p className="text-gray-600 mb-6">
          Your email has been submitted successfully.
          {wantsReport && " You will receive your full report shortly."}
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 inline-block">
          <p className="text-sm text-gray-500 mb-1">
            Remember your anonymous token:
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
        Get Your Results by Email
      </h1>
      <p className="text-gray-500 mb-8">
        Optionally provide your email to receive a detailed report and stay
        updated on founder mental health research.
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

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsReport}
              onChange={(e) => setWantsReport(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-gray-700 text-sm">
              Send me a detailed report of my results
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={wantsUpdates}
              onChange={(e) => setWantsUpdates(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span className="text-gray-700 text-sm">
              Keep me updated on founder mental health research and insights
            </span>
          </label>
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
