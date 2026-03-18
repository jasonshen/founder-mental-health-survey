"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ResultsDisplay from "@/components/ResultsDisplay";

function ResultsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

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

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
