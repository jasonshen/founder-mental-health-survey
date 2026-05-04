"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import PageChrome from "@/components/PageChrome";

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

interface InterestOption {
  key:
    | "wantsReportAndUpdates"
    | "wantsCoaching"
    | "wantsRetreat"
    | "wantsPlantMedicine";
  title: string;
  help: string;
}

const INTERESTS: InterestOption[] = [
  {
    key: "wantsReportAndUpdates",
    title: "My full report and research updates",
    help: "A detailed analysis of your responses sent in about 2 weeks, plus aggregate findings from the survey and ongoing founder mental health research. The report lives at your anonymous results URL — you'll need your saved access code (or a bookmark) to view it.",
  },
  {
    key: "wantsCoaching",
    title: "Coaching resources for founders",
    help: "Curated list of coaches and therapists who specialize in working with startup founders.",
  },
  {
    key: "wantsRetreat",
    title: "In-person founder retreat",
    help: "Small-group retreats designed for founders to rest, reflect, and connect with peers.",
  },
  {
    key: "wantsPlantMedicine",
    title: "Plant medicine / psychedelic-assisted therapy",
    help: "Information about legal, clinically supervised psychedelic-assisted therapy programs.",
  },
];

function EmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [interests, setInterests] = useState<Record<InterestOption["key"], boolean>>({
    wantsReportAndUpdates: true,
    wantsCoaching: false,
    wantsRetreat: false,
    wantsPlantMedicine: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: InterestOption["key"]) {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
          // The "Full report + research updates" checkbox sets both flags
          // server-side; the analytics layer still tracks them separately so
          // we can split out who specifically asked for ongoing updates vs.
          // their own report if that distinction ever matters again.
          wants_report: interests.wantsReportAndUpdates,
          wants_coaching: interests.wantsCoaching,
          wants_retreat: interests.wantsRetreat,
          wants_plant_medicine: interests.wantsPlantMedicine,
          wants_updates: interests.wantsReportAndUpdates,
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
      <PageChrome left="FMHS · Stay connected" right="Anonymous">
        <div className="alert alert-error" role="alert">
          <p className="alert-h">No token provided.</p>
          <ul>
            <li>Please check your link.</li>
          </ul>
        </div>
      </PageChrome>
    );
  }

  if (submitted) {
    return (
      <PageChrome left="FMHS · Thank you" right="Anonymous">
        <h1 className="fmhs-title">
          Thank you<span className="accent">.</span>
        </h1>
        <p className="fmhs-deck">
          Your email has been submitted.
          {interests.wantsReportAndUpdates &&
            " We'll send your detailed report in about 2 weeks."}{" "}
          We&apos;ll be in touch about the resources you expressed interest in.
        </p>

        <div className="code-chip" style={{ margin: "8px 0 32px" }}>
          <div className="label">Your private access code</div>
          <p className="help">
            Save this somewhere safe or bookmark your results page — your
            responses are anonymous, so we don&apos;t store this code with your
            email. It&apos;s the only way back to your results, including the
            detailed report when it&apos;s ready.
          </p>
          <code>{token}</code>
        </div>

        <div className="cta-row">
          <Link href={`/results?token=${token}`} className="btn">
            View your results
            <Arrow />
          </Link>
        </div>
      </PageChrome>
    );
  }

  return (
    <PageChrome left="FMHS · Stay connected" right="Anonymous">
      <h1 className="fmhs-title">
        Stay connected<span className="accent">.</span>
      </h1>
      <p className="fmhs-deck">
        Leave your email to get your detailed report (sent in about 2 weeks)
        and learn about resources for founder mental health. We respect your
        privacy and will never share your email.
      </p>

      <form onSubmit={handleSubmit} className="form-stack" style={{ marginTop: 24 }}>
        <div>
          <label htmlFor="email" className="field-label">
            Email address<span className="req">*</span>
          </label>
          <input
            type="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="founder@startup.com"
            className="input"
          />
        </div>

        <div>
          <span className="field-label">
            I&apos;m interested in (check all that apply)
          </span>
          <div className="check-stack">
            {INTERESTS.map((opt) => {
              const checked = interests[opt.key];
              return (
                <label key={opt.key} className={checked ? "on" : ""}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.key)}
                  />
                  <span>
                    <span className="check-title">{opt.title}</span>
                    <span className="check-help">{opt.help}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <p className="alert-h">Something went wrong.</p>
            <ul>
              <li>{error}</li>
            </ul>
          </div>
        )}

        <div className="cta-row">
          <button
            type="submit"
            disabled={submitting}
            aria-disabled={submitting}
            className="btn"
          >
            {submitting ? "Submitting…" : "Submit"}
            {!submitting && <Arrow />}
          </button>
          <Link href={`/results?token=${token}`} className="btn-link">
            Skip and return to results
          </Link>
        </div>
      </form>
    </PageChrome>
  );
}

export default function EmailPage() {
  return (
    <Suspense
      fallback={
        <PageChrome left="FMHS · Stay connected" right="Loading">
          <p className="fmhs-deck">Loading…</p>
        </PageChrome>
      }
    >
      <EmailContent />
    </Suspense>
  );
}
