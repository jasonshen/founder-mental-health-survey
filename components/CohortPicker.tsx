/**
 * Survey-closed state for the about page. The survey has ended, so this
 * replaces the former "Begin the survey" cohort picker (which routed to
 * /consent) with a static closed notice. Aggregate results to follow.
 */
export default function CohortPicker() {
  return (
    <div className="cta-row" style={{ marginTop: 32 }}>
      <span className="btn" aria-disabled="true">
        Survey closed
      </span>
      <span className="btn-meta">
        Thank you to everyone who took part — aggregate results coming soon.
      </span>
    </div>
  );
}
