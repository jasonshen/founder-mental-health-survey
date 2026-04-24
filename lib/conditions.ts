import type { FlatResponses, Question, ResponseValue } from "./types";
import type { SectionMeta } from "./questions";
import { SECTIONS } from "./questions";

/**
 * The client already stores responses as a flat {questionId: value} map.
 * This helper exists so we can swap to a nested shape later without
 * touching every call site.
 */
export function flattenResponses(
  responses: Record<string, ResponseValue>
): FlatResponses {
  return responses;
}

export function isSectionVisible(
  section: SectionMeta,
  responses: FlatResponses
): boolean {
  return !section.condition || section.condition(responses);
}

export function isQuestionVisible(
  q: Question,
  responses: FlatResponses
): boolean {
  if (q.condition && !q.condition(responses)) return false;
  if (q.specifyIf) {
    const target = responses[q.specifyIf.questionId];
    if (target !== q.specifyIf.value) return false;
  }
  return true;
}

export function visibleSections(responses: FlatResponses): SectionMeta[] {
  return SECTIONS.filter((s) => isSectionVisible(s, responses));
}
