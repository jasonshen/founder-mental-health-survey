"use client";

import { ReactNode } from "react";

interface SurveySectionProps {
  title: string;
  intro: string;
  children: ReactNode;
}

export default function SurveySection({
  title,
  intro,
  children,
}: SurveySectionProps) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-8">{intro}</p>
      <div className="space-y-8">{children}</div>
    </div>
  );
}
