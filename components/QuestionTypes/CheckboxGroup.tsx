"use client";

import type { Question } from "@/lib/types";

interface CheckboxGroupProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

const EXCLUSIVE_OPTIONS = new Set(["None of the above", "Prefer not to say"]);

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
      // Selecting an exclusive option clears all others.
      onChange([option]);
      return;
    }

    // Selecting a non-exclusive option clears any exclusive selections.
    const next = value.filter((v) => !EXCLUSIVE_OPTIONS.has(v));
    next.push(option);
    onChange(next);
  }

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
        role="group"
        aria-labelledby={labelId}
        className="flex flex-col gap-2"
      >
        {options.map((option) => {
          const checked = value.includes(option);
          return (
            <label
              key={option}
              className={`flex items-center gap-3 min-h-[44px] px-4 py-3 rounded-lg border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 ${
                checked
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              <input
                type="checkbox"
                name={question.id}
                value={option}
                checked={checked}
                onChange={() => toggle(option)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm sm:text-base text-gray-800">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
