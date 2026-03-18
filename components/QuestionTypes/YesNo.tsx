"use client";

import type { Question } from "@/lib/types";

interface YesNoProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function YesNo({ question, value, onChange }: YesNoProps) {
  return (
    <div className="mb-2">
      <label className="block text-base font-medium text-gray-900 mb-3">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="flex gap-3">
        {["Yes", "No"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-6 py-2.5 rounded-lg border font-medium transition-colors cursor-pointer ${
              value === option
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
