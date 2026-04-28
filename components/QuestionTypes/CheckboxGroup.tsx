"use client";

import type { Question } from "@/lib/types";

interface CheckboxGroupProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

const EXCLUSIVE_OPTIONS = new Set(["None of the above", "Prefer not to say"]);

/**
 * CheckboxGroup — multiple-select. Same .scale-opt visual as the radio types,
 * but with `aria-checked` on `<button>`s rather than radiogroup semantics.
 * Exclusive options ("None of the above" / "Prefer not to say") clear other
 * selections when picked, and vice versa.
 */
export default function CheckboxGroup({
  question,
  value,
  onChange,
}: CheckboxGroupProps) {
  const options = question.options || [];
  const labelId = `${question.id}-label`;

  function toggle(option: string) {
    const isExclusive = EXCLUSIVE_OPTIONS.has(option);
    const alreadyChecked = value.includes(option);

    if (alreadyChecked) {
      onChange(value.filter((v) => v !== option));
      return;
    }

    if (isExclusive) {
      onChange([option]);
      return;
    }

    const next = value.filter((v) => !EXCLUSIVE_OPTIONS.has(v));
    next.push(option);
    onChange(next);
  }

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
      <div role="group" aria-labelledby={labelId} className="opt-list">
        {options.map((option) => {
          const checked = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(option)}
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
