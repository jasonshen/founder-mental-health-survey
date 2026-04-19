"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  getQuestionsBySection,
  SECTIONS,
  SECTION_ORDER,
} from "@/lib/questions";
import type { Question } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import SurveySection from "@/components/SurveySection";
import LikertScale from "@/components/QuestionTypes/LikertScale";
import SingleSelect from "@/components/QuestionTypes/SingleSelect";
import Dropdown from "@/components/QuestionTypes/Dropdown";

// Bump this when the question set changes, to invalidate stale drafts.
const SURVEY_VERSION = "v2-2026-04";
const DRAFT_KEY = "fmh_survey_draft";

type ResponseValue = string | string[] | number;

interface Draft {
  version: string;
  responses: Record<string, ResponseValue>;
  currentSectionIndex: number;
  submission_id: string;
  savedAt: string;
}

function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (parsed.version !== SURVEY_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(d: Draft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    // Quota exceeded or private mode — fail silently.
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // noop
  }
}

export default function SurveyPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);

  // Stable submission_id for this survey session. Used for server-side idempotency.
  const submissionIdRef = useRef<string>("");
  if (!submissionIdRef.current && typeof window !== "undefined") {
    submissionIdRef.current = (crypto as Crypto & { randomUUID: () => string }).randomUUID();
  }

  // Hydrate from draft on mount.
  useEffect(() => {
    const draft = loadDraft();
    if (draft && Object.keys(draft.responses).length > 0) {
      setPendingDraft(draft);
      setShowResumePrompt(true);
    }
  }, []);

  // Persist on every response or section change.
  useEffect(() => {
    if (showResumePrompt) return; // don't overwrite draft until user decides
    if (Object.keys(responses).length === 0 && currentSectionIndex === 0) return;
    saveDraft({
      version: SURVEY_VERSION,
      responses,
      currentSectionIndex,
      submission_id: submissionIdRef.current,
      savedAt: new Date().toISOString(),
    });
  }, [responses, currentSectionIndex, showResumePrompt]);

  function handleResumeDraft() {
    if (!pendingDraft) return;
    setResponses(pendingDraft.responses);
    setCurrentSectionIndex(pendingDraft.currentSectionIndex);
    submissionIdRef.current = pendingDraft.submission_id;
    setShowResumePrompt(false);
    setPendingDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft();
    setShowResumePrompt(false);
    setPendingDraft(null);
  }

  const currentSectionId = SECTION_ORDER[currentSectionIndex];
  const currentSectionMeta = SECTIONS.find((s) => s.id === currentSectionId)!;
  const currentQuestions = getQuestionsBySection(currentSectionId);
  const totalSections = SECTION_ORDER.length;
  const isLastSection = currentSectionIndex === totalSections - 1;

  const handleResponseChange = useCallback(
    (questionId: string, value: string | string[] | number) => {
      setResponses((prev) => ({ ...prev, [questionId]: value }));
      setValidationErrors((prev) => prev.filter((id) => id !== questionId));
    },
    []
  );

  const validateCurrentSection = useCallback((): boolean => {
    const errors: string[] = [];
    for (const question of currentQuestions) {
      if (!question.required) continue;
      const response = responses[question.id];
      if (response === undefined || response === "" || response === null) {
        errors.push(question.id);
      } else if (Array.isArray(response) && response.length === 0) {
        errors.push(question.id);
      }
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentQuestions, responses]);

  const handleNext = useCallback(() => {
    if (!validateCurrentSection()) {
      const firstError = document.querySelector('[data-has-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (isLastSection) {
      handleSubmit();
      return;
    }

    setCurrentSectionIndex((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [validateCurrentSection, isLastSection, currentSectionIndex]);

  const handleBack = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
      setValidationErrors([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentSectionIndex]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const groupedResponses: Record<string, Record<string, ResponseValue>> = {};
      for (const sectionId of SECTION_ORDER) {
        groupedResponses[sectionId] = {};
      }

      for (const [questionId, value] of Object.entries(responses)) {
        for (const sectionId of SECTION_ORDER) {
          const sectionQuestions = getQuestionsBySection(sectionId);
          if (sectionQuestions.some((q) => q.id === questionId)) {
            groupedResponses[sectionId][questionId] = value;
            break;
          }
        }
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionIdRef.current,
          responses: groupedResponses,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        token?: string;
        error?: string;
      };

      if (!res.ok || !body.token) {
        throw new Error(
          body.error || "Something went wrong saving your responses."
        );
      }

      // Success — clear the draft so future visits start fresh.
      clearDraft();
      window.location.href = `/results?token=${body.token}`;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setSubmitError(message);
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    const hasError = validationErrors.includes(question.id);

    const errorId = `${question.id}-error`;
    const wrapper = (children: React.ReactNode) => (
      <div
        key={question.id}
        data-has-error={hasError}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={`rounded-lg p-4 -mx-4 ${
          hasError ? "bg-red-50 ring-1 ring-red-200" : ""
        }`}
      >
        {children}
        {hasError && (
          <p id={errorId} className="text-sm text-red-700 mt-2" role="alert">
            This question is required.
          </p>
        )}
      </div>
    );

    switch (question.type) {
      case "likert4":
      case "likert5":
        return wrapper(
          <LikertScale
            question={question}
            value={(responses[question.id] as string) || ""}
            onChange={(val) => handleResponseChange(question.id, val)}
          />
        );
      case "single_select":
        return wrapper(
          <SingleSelect
            question={question}
            value={(responses[question.id] as string) || ""}
            onChange={(val) => handleResponseChange(question.id, val)}
          />
        );
      case "dropdown":
        return wrapper(
          <Dropdown
            question={question}
            value={(responses[question.id] as string) || ""}
            onChange={(val) => handleResponseChange(question.id, val)}
          />
        );
      case "number":
        return wrapper(
          <div className="mb-2">
            <label
              htmlFor={question.id}
              className="block text-base font-medium text-gray-900 mb-3"
            >
              {question.text}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={question.id}
              type="number"
              inputMode="numeric"
              value={
                responses[question.id] !== undefined
                  ? String(responses[question.id])
                  : ""
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  handleResponseChange(question.id, "" as unknown as number);
                } else {
                  handleResponseChange(question.id, Number(val));
                }
              }}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              min={0}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Resume prompt: shown when we detect an in-progress draft.
  if (showResumePrompt && pendingDraft) {
    const answered = Object.keys(pendingDraft.responses).length;
    const savedDate = new Date(pendingDraft.savedAt).toLocaleString();
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600 mb-6">
            We saved your progress from {savedDate}. You answered{" "}
            <strong>{answered}</strong> question{answered === 1 ? "" : "s"} so far.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleResumeDraft}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Resume where I left off
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar
          currentSection={currentSectionIndex}
          totalSections={totalSections}
        />

        <SurveySection
          title={currentSectionMeta.label}
          intro={currentSectionMeta.intro}
        >
          {currentQuestions.map((question) => renderQuestion(question))}
        </SurveySection>

        {validationErrors.length > 0 && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            <p className="text-sm text-red-700">
              Please answer all required questions before continuing.
            </p>
          </div>
        )}

        {submitError && (
          <div
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            <p className="text-sm text-red-700 mb-2">
              <strong>We couldn&apos;t save your responses.</strong> {submitError}
            </p>
            <p className="text-xs text-red-600">
              Your answers are still here — just tap Submit again when you&apos;re
              ready.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentSectionIndex === 0}
            className={`min-h-[44px] px-6 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              currentSectionIndex === 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 hover:bg-gray-100 border border-gray-300"
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={`min-h-[44px] px-6 py-2.5 rounded-lg font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isSubmitting
                ? "bg-indigo-700 cursor-wait opacity-90"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting
              ? "Submitting…"
              : isLastSection
              ? "Submit"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
