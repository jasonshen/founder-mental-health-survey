"use client";

import type { Question } from "@/lib/types";

interface Scale0to10Props {
  question: Question;
  value: number | "";
  onChange: (value: number) => void;
}

const TICKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function Scale0to10({
  question,
  value,
  onChange,
}: Scale0to10Props) {
  const labelId = `${question.id}-label`;
  const left = question.anchors?.left ?? "";
  const right = question.anchors?.right ?? "";

  return (
    <div className="mb-2">
      <div
        id={labelId}
        className="block text-base font-medium text-gray-900 mb-3"
      >
        {question.text}
        {question.required && (
          <span className="text-red-500 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-required={question.required}
        className="flex flex-wrap justify-between gap-1"
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
            <label
              key={n}
              className={`flex-1 min-w-[36px] flex items-center justify-center min-h-[44px] px-1 rounded-lg border cursor-pointer transition-colors text-sm font-medium focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                checked
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={n}
                checked={checked}
                onChange={() => onChange(n)}
                aria-label={anchorLabel}
                className="sr-only"
              />
              <span>{n}</span>
            </label>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
        <span>{left}</span>
        <span className="text-right">{right}</span>
      </div>
    </div>
  );
}
