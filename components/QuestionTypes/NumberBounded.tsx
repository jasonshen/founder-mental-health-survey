"use client";

import type { Question } from "@/lib/types";

interface NumberBoundedProps {
  question: Question;
  value: number | "";
  onChange: (value: number | "") => void;
}

export default function NumberBounded({
  question,
  value,
  onChange,
}: NumberBoundedProps) {
  const min = question.min ?? 0;
  const max = question.max ?? 9999;

  return (
    <div>
      <label htmlFor={question.id} className="question" style={{ display: "block" }}>
        {question.text}
        {question.required && (
          <span className="req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={question.id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value === "" || value === undefined ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange("");
            return;
          }
          const n = Number(raw);
          if (Number.isNaN(n)) return;
          const clamped = Math.min(max, Math.max(min, n));
          onChange(clamped);
        }}
        className="input input-narrow"
      />
      <p className="field-help">
        Range: {min}–{max}
      </p>
    </div>
  );
}
