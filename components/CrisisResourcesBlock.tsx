"use client";

interface CrisisResourcesBlockProps {
  onContinue: () => void;
}

export default function CrisisResourcesBlock({
  onContinue,
}: CrisisResourcesBlockProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        A quick pause
      </h2>
      <p className="text-gray-700 mb-6">
        Some of those questions asked about difficult things. If you&apos;re
        struggling right now, please know that support is available:
      </p>
      <ul className="space-y-3 mb-8 text-gray-800">
        <li className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <strong className="text-indigo-900">988</strong> — Call or text for
          the Suicide &amp; Crisis Lifeline (US)
        </li>
        <li className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <strong className="text-indigo-900">741741</strong> — Text{" "}
          <strong>HOME</strong> for Crisis Text Line
        </li>
        <li className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-700 underline hover:text-indigo-900"
          >
            findahelpline.com
          </a>{" "}
          — International directory
        </li>
      </ul>
      <p className="text-gray-600 mb-6">
        You can continue the survey when you&apos;re ready.
      </p>
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onContinue}
          className="min-h-[44px] px-6 py-2.5 rounded-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
