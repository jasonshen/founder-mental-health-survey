"use client";

import type { Question } from "@/lib/types";

interface LikertScaleProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

/**
 * Likert (PHQ/GAD-style) — uses the FMHS Style Guide `.scale` grid for ≤4
 * options (renders as a 4-up button row), and falls back to a vertical
 * `.opt-list` for longer scales (e.g. AQ-10's 4 options can stay a row,
 * but an MBI-style 7-point scale renders cleanly stacked).
 */
export default function LikertScale({
  question,
  value,
  onChange,
}: LikertScaleProps) {
  const options = question.options || [];
  const labelId = `${question.id}-label`;
  const useGrid = options.length <= 4;

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
        className={useGrid ? "scale" : "opt-list"}
      >
        {options.map((option, i) => {
          const checked = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(option)}
              className={`scale-opt ${checked ? "on" : ""}`}
            >
              <span className="n">{i}</span>
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
