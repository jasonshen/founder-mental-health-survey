"use client";

import type { Question } from "@/lib/types";

interface MultiSelectProps {
  question: Question;
  value: string[];
  onChange: (value: string[]) => void;
}

export default function MultiSelect({
  question,
  value,
  onChange,
}: MultiSelectProps) {
  const options = question.options || [];

  const handleToggle = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="mb-2">
      <label className="block text-base font-medium text-gray-900 mb-1">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
              value.includes(option)
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-300 bg-white hover:border-gray-400"
            }`}
          >
            <input
              type="checkbox"
              checked={value.includes(option)}
              onChange={() => handleToggle(option)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
