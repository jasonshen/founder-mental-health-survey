"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  getQuestionsBySection,
  SECTIONS,
  type SectionMeta,
} from "@/lib/questions";
import {
  type Question,
  type ResponseValue,
  type SectionId,
} from "@/lib/types";
import {
  isQuestionVisible,
  isSectionVisible,
} from "@/lib/conditions";
import ProgressBar from "@/components/ProgressBar";
import SurveySection from "@/components/SurveySection";
import LikertScale from "@/components/QuestionTypes/LikertScale";
import SingleSelect from "@/components/QuestionTypes/SingleSelect";
import Dropdown from "@/components/QuestionTypes/Dropdown";
import Scale0to10 from "@/components/QuestionTypes/Scale0to10";
import CheckboxGroup from "@/components/QuestionTypes/CheckboxGroup";
import Textarea from "@/components/QuestionTypes/Textarea";
import NumberBounded from "@/components/QuestionTypes/NumberBounded";
import CrisisResourcesBlock from "@/components/CrisisResourcesBlock";

// Bump this when the question set changes, to invalidate stale drafts.
const SURVEY_VERSION = "v3-2026-04";
const DRAFT_KEY = "fmh_survey_draft";

type FlatResponses = Record<string, ResponseValue>;

interface Draft {
  version: string;
  responses: FlatResponses;
  currentSectionIndex: number;
  submission_id: string;
  savedAt: string;
  postSectionShown?: string;
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

async function postSectionSave(
  submission_id: string,
  section_id: SectionId,
  responses: FlatResponses,
  sectionQuestions: Question[]
) {
  // Only send responses that belong to this section.
  const sectionResponses: FlatResponses = {};
  for (const q of sectionQuestions) {
    if (responses[q.id] !== undefined && responses[q.id] !== "") {
      sectionResponses[q.id] = responses[q.id];
    }
  }

  try {
    await fetch("/api/save-section", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submission_id,
        section_id,
        responses: sectionResponses,
      }),
      keepalive: true,
    });
  } catch {
    // Fail silently — localStorage is the source of truth on the client.
  }
}

export default function SurveyPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<FlatResponses>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [showingPostSection, setShowingPostSection] = useState<SectionId | null>(null);

  // Stable submission_id for this survey session.
  const submissionIdRef = useRef<string>("");
  if (!submissionIdRef.current && typeof window !== "undefined") {
    submissionIdRef.current = (crypto as Crypto & { randomUUID: () => string }).randomUUID();
  }

  // Compute the flow of sections to actually render, given current answers.
  // Re-evaluates when `responses` changes so skip logic is reactive.
  const visibleSections: SectionMeta[] = useMemo(
    () => SECTIONS.filter((s) => isSectionVisible(s, responses)),
    [responses]
  );

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
    if (showResumePrompt) return;
    if (
      Object.keys(responses).length === 0 &&
      currentSectionIndex === 0 &&
      !showingPostSection
    )
      return;
    saveDraft({
      version: SURVEY_VERSION,
      responses,
      currentSectionIndex,
      submission_id: submissionIdRef.current,
      savedAt: new Date().toISOString(),
      postSectionShown: showingPostSection ?? undefined,
    });
  }, [responses, currentSectionIndex, showResumePrompt, showingPostSection]);

  function handleResumeDraft() {
    if (!pendingDraft) return;
    setResponses(pendingDraft.responses);
    setCurrentSectionIndex(pendingDraft.currentSectionIndex);
    submissionIdRef.current = pendingDraft.submission_id;
    if (pendingDraft.postSectionShown) {
      setShowingPostSection(pendingDraft.postSectionShown as SectionId);
    }
    setShowResumePrompt(false);
    setPendingDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft();
    setShowResumePrompt(false);
    setPendingDraft(null);
  }

  // Clamp currentSectionIndex into the visibleSections range.
  const safeIndex = Math.min(
    currentSectionIndex,
    Math.max(0, visibleSections.length - 1)
  );
  const currentSectionMeta = visibleSections[safeIndex];
  const currentSectionId: SectionId | undefined = currentSectionMeta?.id;
  const allSectionQuestions = currentSectionId
    ? getQuestionsBySection(currentSectionId)
    : [];
  const visibleQuestions = allSectionQuestions.filter((q) =>
    isQuestionVisible(q, responses)
  );
  const totalVisible = visibleSections.length;
  const isLastSection = safeIndex === totalVisible - 1;

  const handleResponseChange = useCallback(
    (questionId: string, value: ResponseValue) => {
      setResponses((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const handleNext = useCallback(() => {
    if (!currentSectionMeta) return;

    // Fire-and-forget partial save before advancing.
    void postSectionSave(
      submissionIdRef.current,
      currentSectionMeta.id,
      responses,
      allSectionQuestions
    );

    // If this section has a post-section info card (crisis resources), show it before advancing.
    if (currentSectionMeta.postSection === "crisis_resources") {
      setShowingPostSection(currentSectionMeta.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (isLastSection) {
      void handleSubmit();
      return;
    }

    setCurrentSectionIndex(safeIndex + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSectionMeta, responses, allSectionQuestions, isLastSection, safeIndex]);

  const handleContinueFromPostSection = useCallback(() => {
    setShowingPostSection(null);
    if (isLastSection) {
      void handleSubmit();
      return;
    }
    setCurrentSectionIndex(safeIndex + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLastSection, safeIndex]);

  const handleBack = useCallback(() => {
    if (showingPostSection) {
      setShowingPostSection(null);
      return;
    }
    if (safeIndex > 0) {
      setCurrentSectionIndex(safeIndex - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [safeIndex, showingPostSection]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Group flat {qid: value} into {sectionId: {qid: value}} so the server
      // can write each section to its own DB column.
      const grouped: Record<string, FlatResponses> = {};
      for (const [qid, value] of Object.entries(responses)) {
        for (const section of SECTIONS) {
          const sectionQs = getQuestionsBySection(section.id);
          if (!sectionQs.some((q) => q.id === qid)) continue;
          if (!grouped[section.id]) grouped[section.id] = {};
          grouped[section.id][qid] = value;
          break;
        }
      }

      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submissionIdRef.current,
          responses: grouped,
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
    const key = question.id;
    switch (question.type) {
      case "likert4":
      case "likert5":
      case "likert6_freq":
      case "likert7":
      case "yes_no":
      case "yes_no_sometimes":
      case "yes_no_prefernot":
        return (
          <div key={key}>
            <LikertScale
              question={question}
              value={(responses[question.id] as string) || ""}
              onChange={(val) => handleResponseChange(question.id, val)}
            />
          </div>
        );
      case "single_select":
        return (
          <div key={key}>
            <SingleSelect
              question={question}
              value={(responses[question.id] as string) || ""}
              onChange={(val) => handleResponseChange(question.id, val)}
            />
          </div>
        );
      case "dropdown":
        return (
          <div key={key}>
            <Dropdown
              question={question}
              value={(responses[question.id] as string) || ""}
              onChange={(val) => handleResponseChange(question.id, val)}
            />
          </div>
        );
      case "scale_0_10":
        return (
          <div key={key}>
            <Scale0to10
              question={question}
              value={
                typeof responses[question.id] === "number"
                  ? (responses[question.id] as number)
                  : ""
              }
              onChange={(val) => handleResponseChange(question.id, val)}
            />
          </div>
        );
      case "multi_select":
        return (
          <div key={key}>
            <CheckboxGroup
              question={question}
              value={(responses[question.id] as string[]) || []}
              onChange={(val) => handleResponseChange(question.id, val)}
            />
          </div>
        );
      case "text":
        return (
          <div key={key}>
            <Textarea
              question={question}
              value={(responses[question.id] as string) || ""}
              onChange={(val) => handleResponseChange(question.id, val)}
              long={false}
            />
          </div>
        );
      case "text_long":
        return (
          <div key={key}>
            <Textarea
              question={question}
              value={(responses[question.id] as string) || ""}
              onChange={(val) => handleResponseChange(question.id, val)}
              long
            />
          </div>
        );
      case "number_bounded":
        return (
          <div key={key}>
            <NumberBounded
              question={question}
              value={
                typeof responses[question.id] === "number"
                  ? (responses[question.id] as number)
                  : ""
              }
              onChange={(val) => handleResponseChange(question.id, val)}
            />
          </div>
        );
      case "number":
        return (
          <div key={key} className="mb-2">
            <label
              htmlFor={question.id}
              className="block text-base font-medium text-gray-900 mb-3"
            >
              {question.text}
              {question.required && (
                <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              )}
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
                const v = e.target.value;
                if (v === "") {
                  handleResponseChange(question.id, "" as unknown as number);
                } else {
                  handleResponseChange(question.id, Number(v));
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

  // Resume prompt
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

  if (!currentSectionMeta) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar
          currentSection={safeIndex}
          totalSections={totalVisible}
        />

        {showingPostSection === "depression" ? (
          <CrisisResourcesBlock onContinue={handleContinueFromPostSection} />
        ) : (
          <>
            <SurveySection
              title={currentSectionMeta.label}
              intro={currentSectionMeta.intro}
            >
              {visibleQuestions.map((question) => renderQuestion(question))}
              {visibleQuestions.length === 0 && (
                <p className="text-gray-500 italic">
                  No questions in this section right now.
                </p>
              )}
            </SurveySection>

            {submitError && (
              <div
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
              >
                <p className="text-sm text-red-700 mb-2">
                  <strong>We couldn&apos;t save your responses.</strong> {submitError}
                </p>
                <p className="text-xs text-red-600">
                  Your answers are still here — just tap Submit again when you&apos;re ready.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                disabled={safeIndex === 0}
                className={`min-h-[44px] px-6 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  safeIndex === 0
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
          </>
        )}
      </div>
    </div>
  );
}
