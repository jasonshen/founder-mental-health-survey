"use client";

interface ProgressBarProps {
  currentSection: number;
  totalSections: number;
}

/**
 * Progress bar — 3px orange fill on a line track, mono labels in muted gray.
 * Pads the count to 2 digits so the meter doesn't visually jiggle as the
 * label widens from "1" to "10".
 */
export default function ProgressBar({
  currentSection,
  totalSections,
}: ProgressBarProps) {
  const idx = currentSection + 1;
  const pct = Math.round((idx / totalSections) * 100);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="progress" aria-label={`Section ${idx} of ${totalSections}`}>
      <span>
        SECTION {pad(idx)} · {pad(totalSections)}
      </span>
      <div className="track">
        <div
          className="fill"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span>{pct}%</span>
    </div>
  );
}
