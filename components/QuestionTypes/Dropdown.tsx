"use client";

import type { Question } from "@/lib/types";

interface DropdownProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function Dropdown({ question, value, onChange }: DropdownProps) {
  const options = question.options || [];

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
      {/* text-base (16px) prevents iOS zoom on focus */}
      <select
        id={question.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={question.required}
        className={`w-full min-h-[44px] px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${
          value ? "border-gray-300 text-gray-900" : "border-gray-300 text-gray-400"
        }`}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
