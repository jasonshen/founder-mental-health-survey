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
      <h2 className="product-sec-h">{title}</h2>
      <p className="product-sec-sub">{intro}</p>
      <div className="form-stack">{children}</div>
    </div>
  );
}
