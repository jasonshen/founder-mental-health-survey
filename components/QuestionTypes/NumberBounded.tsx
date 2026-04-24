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
    <div className="mb-2">
      <label
        htmlFor={question.id}
        className="block text-base font-medium text-gray-900 mb-3"
      >
        {question.text}
        {question.required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
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
        className="w-32 px-3 py-2 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
      />
      <p className="text-xs text-gray-500 mt-1">
        Range: {min}–{max}
      </p>
    </div>
  );
}
