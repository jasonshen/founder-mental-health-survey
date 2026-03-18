"use client";

import { useParams } from "next/navigation";
import ResultsDisplay from "@/components/ResultsDisplay";

export default function ResultsByTokenPage() {
  const params = useParams();
  const token = params.token as string;

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 text-lg">
          No token provided. Please check your results link.
        </p>
      </div>
    );
  }

  return <ResultsDisplay token={token} />;
}
