import Link from "next/link";

/* Arrow icon used inside the primary CTA. */
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
 * About-page CTA. The survey is closed, so the former "Begin the survey"
 * cohort picker now points to the published 2026 results instead.
 */
export default function CohortPicker() {
  return (
    <div className="cta-row" style={{ marginTop: 32 }}>
      <Link href="/results/2026" className="btn">
        See the 2026 results
        <Arrow />
      </Link>
      <span className="btn-meta">Survey closed · aggregate results, updated over time</span>
    </div>
  );
}
