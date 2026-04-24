"use client";

import type { Question } from "@/lib/types";

interface TextareaProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
  long?: boolean;
}

export default function Textarea({
  question,
  value,
  onChange,
  long = false,
}: TextareaProps) {
  const maxLength = question.maxLength ?? (long ? 1000 : 500);
  const chars = value?.length ?? 0;

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
      <textarea
        id={question.id}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v.length <= maxLength) onChange(v);
        }}
        rows={long ? 6 : 3}
        maxLength={maxLength}
        className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
      />
      <div className="text-xs text-gray-500 text-right mt-1">
        {chars} / {maxLength}
      </div>
    </div>
  );
}
