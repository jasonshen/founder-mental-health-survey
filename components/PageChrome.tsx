import type { ReactNode } from "react";

/**
 * PageChrome — shared survey/results page wrap with the FMHS label-row.
 *
 * Renders the academic-style header (`FMHS · ... ●` left, `... · ...` right)
 * above the page content, inside the standard 760px column with the V5
 * Research Paper padding. Use anywhere outside the landing page.
 */

interface PageChromeProps {
  /** Left label segment, e.g. "FMHS · Section 02 of 18". The orange ● is appended automatically. */
  left: ReactNode;
  /** Right label segment, e.g. "Anonymous · ~6 min left". */
  right: ReactNode;
  children: ReactNode;
}

export default function PageChrome({ left, right, children }: PageChromeProps) {
  return (
    <div className="fmhs-page">
      <div className="label-row">
        <span className="left">
          {left} <span className="tick">●</span>
        </span>
        <span>{right}</span>
      </div>
      {children}
    </div>
  );
}
