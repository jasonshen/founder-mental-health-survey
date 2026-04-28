"use client";

import type { Question } from "@/lib/types";

interface DropdownProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function Dropdown({
  question,
  value,
  onChange,
}: DropdownProps) {
  const options = question.options || [];

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
      {/* font-size 15 keeps iOS from zooming on focus while staying ≥16px effective */}
      <select
        id={question.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required={question.required}
        className="input"
        style={{
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 20 20' fill='%23807871'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: 36,
        }}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
