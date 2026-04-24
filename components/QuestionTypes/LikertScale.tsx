"use client";

import type { Question } from "@/lib/types";

interface LikertScaleProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function LikertScale({
  question,
  value,
  onChange,
}: LikertScaleProps) {
  const options = question.options || [];
  const labelId = `${question.id}-label`;

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
        className="flex flex-col gap-2"
      >
        {options.map((option) => {
          const checked = value === option;
          return (
            <label
              key={option}
              className={`flex items-center gap-2 min-h-[44px] px-4 py-3 sm:py-2 rounded-lg border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                checked
                  ? "border-indigo-600 bg-indigo-50 text-indigo-800"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={checked}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span className="text-sm sm:text-base">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
