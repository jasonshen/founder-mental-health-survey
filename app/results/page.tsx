"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ResultsDisplay from "@/components/ResultsDisplay";
import PageChrome from "@/components/PageChrome";

function ResultsContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <PageChrome left="FMHS · Results" right="Anonymous">
        <div className="alert alert-error" role="alert">
          <p className="alert-h">No token provided.</p>
          <ul>
            <li>Please check your results link, or paste your access code.</li>
          </ul>
        </div>
      </PageChrome>
    );
  }

  return <ResultsDisplay token={token} />;
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <PageChrome left="FMHS · Results" right="Loading">
          <p className="fmhs-deck">Loading…</p>
        </PageChrome>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
