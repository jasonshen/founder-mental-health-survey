"use client";

import type { Question } from "@/lib/types";

interface Scale0to10Props {
  question: Question;
  value: number | "";
  onChange: (value: number) => void;
}

const TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * 0–10 ladder — narrow square cells in a single row (collapses to 6 wide on
 * narrow screens). Selected cell is solid orange with white digit; rest are
 * line-bordered white. Anchor labels render below.
 */
export default function Scale0to10({
  question,
  value,
  onChange,
}: Scale0to10Props) {
  const labelId = `${question.id}-label`;
  const left = question.anchors?.left ?? "";
  const right = question.anchors?.right ?? "";

  return (
    <div>
      <p id={labelId} className="question">
        {question.text}
        {question.required && (
          <span className="req" aria-hidden="true">
            *
          </span>
        )}
      </p>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-required={question.required}
        className="ladder"
      >
        {TICKS.map((n) => {
          const checked = value === n;
          const anchorLabel =
            n === 0
              ? `0, ${left}`
              : n === 10
              ? `10, ${right}`
              : `${n} out of 10`;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={anchorLabel}
              onClick={() => onChange(n)}
              className={`ladder-opt ${checked ? "on" : ""}`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <div className="ladder-anchors">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
}
