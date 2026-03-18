"use client";

import { ReactNode } from "react";
import type { Question } from "@/lib/types";

interface ConditionalGroupProps {
  question: Question;
  allResponses: Record<string, string | string[] | number>;
  children: ReactNode;
}

export default function ConditionalGroup({
  question,
  allResponses,
  children,
}: ConditionalGroupProps) {
  if (!question.conditionalOn) {
    return <>{children}</>;
  }

  const parentValue = allResponses[question.conditionalOn];
  const conditionalValues = Array.isArray(question.conditionalValue)
    ? question.conditionalValue
    : [question.conditionalValue];

  const conditionMet = conditionalValues.includes(parentValue as string);

  if (!conditionMet) {
    return null;
  }

  return <>{children}</>;
}
