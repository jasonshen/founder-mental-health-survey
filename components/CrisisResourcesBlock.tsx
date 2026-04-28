"use client";

interface CrisisResourcesBlockProps {
  onContinue: () => void;
}

/**
 * Post-section interstitial after the depression screener — gives the
 * respondent a moment, surfaces hotlines, and waits for an explicit
 * "continue" before resuming.
 */
export default function CrisisResourcesBlock({
  onContinue,
}: CrisisResourcesBlockProps) {
  return (
    <div>
      <h2 className="product-sec-h">A quick pause.</h2>
      <p className="product-sec-sub">
        Some of those questions asked about difficult things. If you&apos;re
        struggling right now, please know that support is available.
      </p>

      <ul className="resource-list">
        <li>
          <strong>988</strong> — Call or text for the Suicide &amp; Crisis
          Lifeline (US)
        </li>
        <li>
          <strong>741741</strong> — Text <strong>HOME</strong> for Crisis Text
          Line
        </li>
        <li>
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            findahelpline.com
          </a>{" "}
          — International directory
        </li>
      </ul>

      <p className="field-help" style={{ marginBottom: 24 }}>
        You can continue the survey when you&apos;re ready.
      </p>

      <div className="nav-row" style={{ justifyContent: "flex-end" }}>
        <button type="button" onClick={onContinue} className="btn">
          Continue
        </button>
      </div>
    </div>
  );
}
