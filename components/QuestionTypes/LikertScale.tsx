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

  return (
    <div className="mb-2">
      <label className="block text-base font-medium text-gray-900 mb-3">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {/* Desktop: horizontal layout */}
      <div className="hidden sm:flex sm:flex-row sm:gap-3 sm:flex-wrap">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
              value === option
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
      {/* Mobile: vertical layout */}
      <div className="flex flex-col gap-2 sm:hidden">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              value === option
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
