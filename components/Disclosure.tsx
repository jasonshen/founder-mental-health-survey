import type { ReactNode } from "react";

interface DisclosureProps {
  summary: string;
  children: ReactNode;
}

/**
 * Native <details>/<summary> with styled chrome. Accessible by default —
 * works with keyboard, screen readers, and the browser's built-in state
 * management. No JavaScript required.
 */
export default function Disclosure({ summary, children }: DisclosureProps) {
  return (
    <details className="group border border-gray-200 rounded-lg bg-white open:bg-gray-50 transition-colors">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-900 flex items-center justify-between hover:bg-gray-50 rounded-lg">
        <span>{summary}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1 text-sm text-gray-700 leading-relaxed space-y-2">
        {children}
      </div>
    </details>
  );
}
