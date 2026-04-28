"use client";

interface ResultsCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ResultsCard({ title, children }: ResultsCardProps) {
  return (
    <div className="card">
      <h3 className="card-h">{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}
