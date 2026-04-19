// ============================================================
// V2 — Streamlined Survey Types
// ============================================================

export type QuestionType =
  | "likert4" // PHQ-9 / GAD-7 scale
  | "likert5" // Founder stress / ASRS scale
  | "yes_no"
  | "single_select" // radio buttons
  | "dropdown" // <select> dropdown
  | "multi_select"
  | "number"
  | "text";

export type SectionId =
  | "company"
  | "adhd"
  | "depression"
  | "anxiety"
  | "founder_stress";

export type InstrumentId = "PHQ-9" | "GAD-7" | "ASRS" | null;

export interface Question {
  id: string;
  section: SectionId;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  instrument: InstrumentId;
}

// ============================================================
// Survey Response Types
// ============================================================

export type SurveyResponses = {
  [questionId: string]: string | string[] | number | boolean;
};

export interface SurveySubmission {
  token: string;
  responses: {
    company: SurveyResponses;
    adhd: SurveyResponses;
    depression: SurveyResponses;
    anxiety: SurveyResponses;
    founder_stress: SurveyResponses;
  };
}

// ============================================================
// Scoring Types
// ============================================================

export type PHQ9Severity =
  | "none"
  | "mild"
  | "moderate"
  | "moderately_severe"
  | "severe";

export type GAD7Severity = "none" | "mild" | "moderate" | "severe";

export interface PHQ9Score {
  score: number;
  severity: PHQ9Severity;
  /** % of general population scoring in the same severity band */
  general_pop_band_pct: number;
  suicidal_ideation_flagged: boolean;
}

export interface GAD7Score {
  score: number;
  severity: GAD7Severity;
  /** % of general population scoring in the same severity band */
  general_pop_band_pct: number;
}

export interface ASRSScore {
  items_flagged: number;
  above_threshold: boolean;
  /** % of general population meeting the ADHD threshold (for context) */
  general_pop_above_threshold_pct: number;
}

export interface AllScores {
  phq9: PHQ9Score;
  gad7: GAD7Score;
  asrs: ASRSScore;
}

// ============================================================
// API Types
// ============================================================

export interface SubmitResponse {
  success: boolean;
  token: string;
}

export interface ResultsResponse {
  scores: AllScores;
  section_company: SurveyResponses;
  section_founder_stress: SurveyResponses;
  created_at: string;
}

export interface EmailSubmission {
  token: string;
  email: string;
  wants_report: boolean;
  wants_coaching: boolean;
  wants_retreat: boolean;
  wants_plant_medicine: boolean;
  wants_updates: boolean;
}
