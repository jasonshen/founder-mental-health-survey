"use client";

interface ResultsCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ResultsCard({ title, children }: ResultsCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );
}
