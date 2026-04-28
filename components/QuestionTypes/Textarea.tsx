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
    <div>
      <label htmlFor={question.id} className="question" style={{ display: "block" }}>
        {question.text}
        {question.required && (
          <span className="req" aria-hidden="true">
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
        className="textarea"
      />
      <p className="field-help" style={{ textAlign: "right" }}>
        {chars} / {maxLength}
      </p>
    </div>
  );
}
