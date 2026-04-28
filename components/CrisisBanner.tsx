"use client";

interface CrisisBannerProps {
  show: boolean;
}

/**
 * Inline crisis banner — surfaced when the depression section reveals
 * concerning self-harm responses. Uses the alert-error treatment from the
 * design system: orange-tint background with a 2px deep-orange left rail.
 */
export default function CrisisBanner({ show }: CrisisBannerProps) {
  if (!show) return null;

  return (
    <div role="alert" aria-live="assertive" className="alert alert-error">
      <p className="alert-h">
        If you&apos;re experiencing thoughts of self-harm, please reach out for
        support.
      </p>
      <ul>
        <li>
          <strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text{" "}
          <a href="tel:988">988</a>
        </li>
        <li>
          <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to{" "}
          <a href="sms:741741">741741</a>
        </li>
      </ul>
    </div>
  );
}
