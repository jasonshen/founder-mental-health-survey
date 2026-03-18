"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  getQuestionsBySection,
  SECTIONS,
  SECTION_ORDER,
} from "@/lib/questions";
import type { Question, SectionId } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";
import SurveySection from "@/components/SurveySection";
import LikertScale from "@/components/QuestionTypes/LikertScale";
import YesNo from "@/components/QuestionTypes/YesNo";
import MultiSelect from "@/components/QuestionTypes/MultiSelect";
import SingleSelect from "@/components/QuestionTypes/SingleSelect";

const PART_TITLES: Record<number, string> = {
  1: "About You",
  2: "Mental Health Screens",
  3: "Treatment & Support",
};

export default function SurveyPage() {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<
    Record<string, string | string[] | number>
  >({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPartTransition, setShowPartTransition] = useState(false);
  const [transitionPart, setTransitionPart] = useState<number | null>(null);

  const currentSectionId = SECTION_ORDER[currentSectionIndex];
  const currentSectionMeta = SECTIONS.find((s) => s.id === currentSectionId)!;
  const currentQuestions = getQuestionsBySection(currentSectionId);
  const totalSections = SECTION_ORDER.length;
  const isLastSection = currentSectionIndex === totalSections - 1;

  const isConditionMet = useCallback(
    (question: Question): boolean => {
      if (!question.conditionalOn) return true;
      const parentValue = responses[question.conditionalOn];
      const conditionalValues = Array.isArray(question.conditionalValue)
        ? question.conditionalValue
        : [question.conditionalValue];
      return conditionalValues.includes(parentValue as string);
    },
    [responses]
  );

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
      if (!isConditionMet(question)) continue;

      const response = responses[question.id];
      if (response === undefined || response === "" || response === null) {
        errors.push(question.id);
      } else if (Array.isArray(response) && response.length === 0) {
        errors.push(question.id);
      }
    }
    setValidationErrors(errors);
    return errors.length === 0;
  }, [currentQuestions, responses, isConditionMet]);

  const showPartTransitionScreen = (partNumber: number) => {
    setTransitionPart(partNumber);
    setShowPartTransition(true);
    setTimeout(() => {
      setShowPartTransition(false);
      setTransitionPart(null);
    }, 1500);
  };

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

    const nextIndex = currentSectionIndex + 1;
    const currentPart = SECTIONS.find(
      (s) => s.id === SECTION_ORDER[currentSectionIndex]
    )!.part;
    const nextPart = SECTIONS.find(
      (s) => s.id === SECTION_ORDER[nextIndex]
    )!.part;

    if (nextPart !== currentPart) {
      showPartTransitionScreen(nextPart);
      setTimeout(() => {
        setCurrentSectionIndex(nextIndex);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1500);
    } else {
      setCurrentSectionIndex(nextIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
    try {
      const token = uuidv4();

      const groupedResponses: Record<string, Record<string, string | string[] | number>> = {};
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
          token,
          responses: groupedResponses,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit survey");
      }

      window.location.href = `/results?token=${token}`;
    } catch (error) {
      console.error("Submit error:", error);
      alert("There was an error submitting your survey. Please try again.");
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    if (!isConditionMet(question)) {
      return null;
    }

    const hasError = validationErrors.includes(question.id);

    const wrapper = (children: React.ReactNode) => (
      <div
        key={question.id}
        data-has-error={hasError}
        className={`rounded-lg p-4 -mx-4 ${
          hasError ? "bg-red-50 ring-1 ring-red-200" : ""
        }`}
      >
        {children}
        {hasError && (
          <p className="text-sm text-red-600 mt-2">
            This question is required.
          </p>
        )}
      </div>
    );

    switch (question.type) {
      case "likert5":
      case "likert4":
        return wrapper(
          <LikertScale
            question={question}
            value={(responses[question.id] as string) || ""}
            onChange={(val) => handleResponseChange(question.id, val)}
          />
        );
      case "yes_no":
        return wrapper(
          <YesNo
            question={question}
            value={(responses[question.id] as string) || ""}
            onChange={(val) => handleResponseChange(question.id, val)}
          />
        );
      case "multi_select":
        return wrapper(
          <MultiSelect
            question={question}
            value={(responses[question.id] as string[]) || []}
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
      case "number":
        return wrapper(
          <div className="mb-2">
            <label
              htmlFor={question.id}
              className="block text-base font-medium text-gray-900 mb-3"
            >
              {question.text}
              {question.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              id={question.id}
              type="number"
              value={
                responses[question.id] !== undefined
                  ? responses[question.id]
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
      case "text":
        return wrapper(
          <div className="mb-2">
            <label
              htmlFor={question.id}
              className="block text-base font-medium text-gray-900 mb-3"
            >
              {question.text}
              {question.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              id={question.id}
              type="text"
              value={(responses[question.id] as string) || ""}
              onChange={(e) =>
                handleResponseChange(question.id, e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (showPartTransition && transitionPart !== null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center animate-pulse">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Part {transitionPart}
          </h1>
          <p className="text-xl text-gray-600">
            {PART_TITLES[transitionPart]}
          </p>
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Please answer all required questions before continuing.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentSectionIndex === 0}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
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
            className={`px-6 py-2.5 rounded-lg font-medium text-white transition-colors ${
              isSubmitting
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSubmitting
              ? "Submitting..."
              : isLastSection
              ? "Submit"
              : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
