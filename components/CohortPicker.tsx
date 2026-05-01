"use client";

import Link from "next/link";
import { useState } from "react";

function Arrow() {
  return (
    <svg
      className="arrow"
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

/**
 * Single "Begin" CTA on the about page that expands into a
 * YC / non-YC picker, then routes to the matching cohort landing.
 * Replaces the two side-by-side CTAs so the homepage has one
 * obvious starting point.
 */
export default function CohortPicker() {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div className="cta-row" style={{ marginTop: 32 }}>
        <button
          type="button"
          className="btn"
          onClick={() => setExpanded(true)}
        >
          Begin the survey
          <Arrow />
        </button>
        <span className="btn-meta">~10 min · Anonymous · Survey ends May 31, 2026</span>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 32,
        padding: "20px 22px",
        border: "1px solid var(--line)",
        borderRadius: 6,
        background: "var(--orange-tint)",
      }}
    >
      <p
        className="field-label"
        style={{ float: "none", marginBottom: 14, fontSize: 15 }}
      >
        Quick question — are you a Y Combinator founder?
      </p>
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <Link href="/consent?cohort=yc" className="btn">
          Yes — YC alum
          <Arrow />
        </Link>
        <Link href="/consent?cohort=general" className="btn btn-ghost">
          No — general founder
          <Arrow />
        </Link>
      </div>
      <button
        type="button"
        className="btn-link"
        onClick={() => setExpanded(false)}
        style={{ fontSize: 13 }}
      >
        ← Back
      </button>
    </div>
  );
}
