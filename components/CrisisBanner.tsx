"use client";

interface CrisisBannerProps {
  show: boolean;
}

export default function CrisisBanner({ show }: CrisisBannerProps) {
  if (!show) return null;

  return (
    <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-6">
      <p className="font-semibold text-amber-900 mb-2">
        If you&apos;re experiencing thoughts of self-harm, please reach out for
        support.
      </p>
      <ul className="text-amber-800 space-y-1 text-sm">
        <li>
          <strong>988 Suicide &amp; Crisis Lifeline:</strong> Call or text{" "}
          <a href="tel:988" className="underline font-semibold">
            988
          </a>
        </li>
        <li>
          <strong>Crisis Text Line:</strong> Text{" "}
          <span className="font-semibold">HOME</span> to{" "}
          <a href="sms:741741" className="underline font-semibold">
            741741
          </a>
        </li>
      </ul>
    </div>
  );
}
