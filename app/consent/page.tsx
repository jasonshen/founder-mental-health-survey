"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageChrome from "@/components/PageChrome";

// localStorage key the survey reads on mount to seed the company section.
// Mirrors fmh_survey_draft format in app/survey/page.tsx.
const FOUNDER_STATUS_SEED_KEY = "fmh_founder_status_seed";

type FounderStatus = "current" | "past";

function Chev() {
  return (
    <svg
      className="chev"
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
    <PageChrome
      left="FMHS · Before you begin"
      right="Confidential · Anonymous · ~10 min"
    >
      <h1 className="fmhs-title">
        Before you begin<span className="accent">.</span>
      </h1>

      <p className="fmhs-deck">
        This is a screening tool, not a diagnosis. It takes about 10 minutes
        and is fully anonymous. Every question is optional.
      </p>
      <p className="fmhs-deck short">
        Some questions ask about mood and self-harm. If any of it feels unsafe,
        you can stop at any time — crisis resources appear where relevant.
      </p>

      <div className="acc-list" style={{ marginTop: 24, marginBottom: 32 }}>
        <details className="acc">
          <summary>
            <span>What you&apos;ll be asked</span>
            <Chev />
          </summary>
          <div className="acc-body">
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
          </div>
        </details>

        <details className="acc">
          <summary>
            <span>How your responses are handled</span>
            <Chev />
          </summary>
          <div className="acc-body">
            <p>
              Responses are tied to a random access code, not your identity. If
              you leave an email afterward, it&apos;s stored in a separate
              table with no link back to your answers. You&apos;ll receive the
              access code at the end — save it, because it&apos;s the only way
              back to your results.
            </p>
          </div>
        </details>
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: "0 0 28px" }}>
        <legend className="field-label" style={{ float: "none", marginBottom: 14 }}>
          Are you a current or past founder?
          <span className="req">*</span>
        </legend>
        <div className="check-stack">
          <label className={founderStatus === "current" ? "on" : ""}>
            <input
              type="radio"
              name="founder_status"
              value="current"
              checked={founderStatus === "current"}
              onChange={() => setFounderStatus("current")}
            />
            <span>
              <span className="check-title">Current founder.</span>
              <span className="check-help">
                I&apos;m actively working on a startup right now.
              </span>
            </span>
          </label>
          <label className={founderStatus === "past" ? "on" : ""}>
            <input
              type="radio"
              name="founder_status"
              value="past"
              checked={founderStatus === "past"}
              onChange={() => setFounderStatus("past")}
            />
            <span>
              <span className="check-title">Past founder.</span>
              <span className="check-help">
                I&apos;ve founded or co-founded a startup before, but I&apos;m
                not actively running one now.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="check-stack" style={{ marginBottom: 32 }}>
        <label className={agreed ? "on" : ""}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <span>
            <span className="check-help" style={{ color: "var(--ink-2)", fontSize: 14 }}>
              I understand this is a screening tool, not a diagnosis, and I
              agree to participate.
            </span>
          </span>
        </label>
      </div>

      <div className="cta-row">
        <button
          type="button"
          className="btn"
          onClick={handleStart}
          disabled={!canContinue}
          aria-disabled={!canContinue}
        >
          Begin the survey
          <Arrow />
        </button>
        <span className="btn-meta">No account · No tracking</span>
      </div>
    </PageChrome>
  );
}
