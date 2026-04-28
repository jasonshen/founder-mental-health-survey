"use client";

import type { Question } from "@/lib/types";

interface SingleSelectProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

/**
 * SingleSelect — vertical radio list, design-system styled. Selected state
 * uses orange-soft + orange border; unselected stays line-bordered on white.
 */
export default function SingleSelect({
  question,
  value,
  onChange,
}: SingleSelectProps) {
  const options = question.options || [];
  const labelId = `${question.id}-label`;

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
        className="opt-list"
      >
        {options.map((option) => {
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
              <span>{option}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
