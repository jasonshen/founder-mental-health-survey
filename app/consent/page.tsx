"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageChrome from "@/components/PageChrome";

// localStorage keys the survey reads on mount to seed section_company.
// Mirrors fmh_survey_draft format in app/survey/begin/page.tsx.
const FOUNDER_STATUS_SEED_KEY = "fmh_founder_status_seed";
const COHORT_SEED_KEY = "fmh_cohort_seed";

type FounderStatus = "current" | "past";
type Cohort = "yc" | "general";
type YcAnswer = "yes" | "no";

function Plus() {
  return (
    <svg
      className="plus"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <rect className="plus-h" x="2" y="8" width="14" height="2" rx="1" fill="currentColor" />
      <rect className="plus-v" x="8" y="2" width="2" height="14" rx="1" fill="currentColor" />
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

function ConsentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL hint: which landing sent the user here. Defaults to "general"
  // if missing or invalid — the YC screener question below is what
  // actually decides the cohort.
  const urlCohort: Cohort = searchParams.get("cohort") === "yc" ? "yc" : "general";

  const [agreed, setAgreed] = useState(false);
  const [founderStatus, setFounderStatus] = useState<FounderStatus | "">("");
  const [ycAnswer, setYcAnswer] = useState<YcAnswer | "">("");

  // Cohort the user actually selected (yes → yc, no → general).
  // Mismatch with urlCohort triggers the switch prompt below.
  const answeredCohort: Cohort | "" =
    ycAnswer === "yes" ? "yc" : ycAnswer === "no" ? "general" : "";
  const isMismatch = answeredCohort !== "" && answeredCohort !== urlCohort;

  const canContinue = agreed && founderStatus !== "" && ycAnswer !== "";

  function seedAndGo(cohort: Cohort) {
    try {
      if (founderStatus !== "") {
        window.localStorage.setItem(FOUNDER_STATUS_SEED_KEY, founderStatus);
      }
      window.localStorage.setItem(COHORT_SEED_KEY, cohort);
    } catch {
      // Quota / private mode — fail silently; survey will just fall back.
    }
    router.push("/survey/begin");
  }

  function handleStayHere() {
    // User chose to stay despite mismatch — honor their YC answer.
    if (answeredCohort !== "") seedAndGo(answeredCohort);
  }

  function handleSwitch() {
    // User accepted the switch — go to the matching landing.
    if (answeredCohort === "yc") {
      router.push("/yc");
    } else if (answeredCohort === "general") {
      router.push("/survey");
    }
  }

  function handleStart() {
    if (!canContinue) return;
    if (isMismatch) return; // Mismatch prompt is showing — user must choose.
    if (answeredCohort !== "") seedAndGo(answeredCohort);
  }

  // Slate theme on the consent page when the active cohort is general.
  // Switches live as the user answers the YC screener.
  const activeCohort: Cohort = answeredCohort !== "" ? answeredCohort : urlCohort;
  const theme = activeCohort === "yc" ? "orange" : "slate";

  return (
    <PageChrome
      left="FMHS · Before you begin"
      right="Confidential · Anonymous · ~10 min"
      theme={theme}
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
            <Plus />
            <span>What you&apos;ll be asked</span>
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
            <Plus />
            <span>How your responses are handled</span>
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

      <fieldset style={{ border: "none", padding: 0, margin: "0 0 28px" }}>
        <legend className="field-label" style={{ float: "none", marginBottom: 14 }}>
          Have you ever been part of Y Combinator (any batch)?
          <span className="req">*</span>
        </legend>
        <div className="check-stack">
          <label className={ycAnswer === "yes" ? "on" : ""}>
            <input
              type="radio"
              name="yc_alum"
              value="yes"
              checked={ycAnswer === "yes"}
              onChange={() => setYcAnswer("yes")}
            />
            <span>
              <span className="check-title">Yes — current or alum.</span>
              <span className="check-help">
                I&apos;ve been through a YC batch (W, S, P, or F).
              </span>
            </span>
          </label>
          <label className={ycAnswer === "no" ? "on" : ""}>
            <input
              type="radio"
              name="yc_alum"
              value="no"
              checked={ycAnswer === "no"}
              onChange={() => setYcAnswer("no")}
            />
            <span>
              <span className="check-title">No.</span>
              <span className="check-help">
                I&apos;m a founder but not part of YC.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {isMismatch && answeredCohort === "yc" && (
        <div
          className="alert"
          role="status"
          style={{
            border: "1px solid var(--ink-3)",
            padding: 16,
            marginBottom: 24,
            borderRadius: 4,
          }}
        >
          <p className="alert-h" style={{ marginTop: 0 }}>
            Looks like you&apos;ve been through YC.
          </p>
          <p style={{ marginBottom: 12 }}>
            We have a YC-specific version of this survey that captures batch
            info — your data adds the most value there. Want to switch?
          </p>
          <div className="cta-row">
            <button type="button" className="btn" onClick={handleSwitch}>
              Switch to the YC survey
              <Arrow />
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={handleStayHere}
              disabled={!canContinue}
              aria-disabled={!canContinue}
            >
              Stay on this one
            </button>
          </div>
        </div>
      )}

      {isMismatch && answeredCohort === "general" && (
        <div
          className="alert"
          role="status"
          style={{
            border: "1px solid var(--ink-3)",
            padding: 16,
            marginBottom: 24,
            borderRadius: 4,
          }}
        >
          <p className="alert-h" style={{ marginTop: 0 }}>
            This version is tailored for YC founders.
          </p>
          <p style={{ marginBottom: 12 }}>
            We have a general founders version that&apos;s a better fit if
            you&apos;re not a YC alum. Want to switch?
          </p>
          <div className="cta-row">
            <button type="button" className="btn" onClick={handleSwitch}>
              Switch to the general survey
              <Arrow />
            </button>
            <button
              type="button"
              className="btn-link"
              onClick={handleStayHere}
              disabled={!canContinue}
              aria-disabled={!canContinue}
            >
              Stay on this one
            </button>
          </div>
        </div>
      )}

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

      {!isMismatch && (
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
      )}
    </PageChrome>
  );
}

export default function ConsentPage() {
  // useSearchParams requires a Suspense boundary in App Router.
  return (
    <Suspense fallback={null}>
      <ConsentInner />
    </Suspense>
  );
}
