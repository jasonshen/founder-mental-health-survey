// ============================================================
// Survey Question Types
// ============================================================

export type QuestionType =
  | "likert5"
  | "likert4"
  | "yes_no"
  | "single_select"
  | "multi_select"
  | "number"
  | "text";

export type SectionId =
  | "demographics"
  | "adhd"
  | "autism"
  | "dark_triad"
  | "depression"
  | "anxiety"
  | "founder_stress"
  | "treatment";

export type PartNumber = 1 | 2 | 3;

export type InstrumentId =
  | "ASRS"
  | "AQ-10"
  | "SD3"
  | "PHQ-9"
  | "GAD-7"
  | null;

export interface Question {
  id: string;
  section: SectionId;
  part: PartNumber;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  instrument: InstrumentId;
  conditionalOn?: string;
  conditionalValue?: string | string[];
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
    demographics: SurveyResponses;
    adhd: SurveyResponses;
    autism: SurveyResponses;
    dark_triad: SurveyResponses;
    depression: SurveyResponses;
    anxiety: SurveyResponses;
    founder_stress: SurveyResponses;
    treatment: SurveyResponses;
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

export type PopulationComparison =
  | "below_average"
  | "average"
  | "above_average";

export interface PHQ9Score {
  score: number;
  severity: PHQ9Severity;
  percentile_general: number;
  suicidal_ideation_flagged: boolean;
}

export interface GAD7Score {
  score: number;
  severity: GAD7Severity;
  percentile_general: number;
}

export interface ASRSScore {
  items_flagged: number;
  above_threshold: boolean;
  percentile_general: number;
}

export interface AQ10Score {
  score: number;
  above_threshold: boolean;
  percentile_general: number;
}

export interface SD3SubscaleScore {
  mean: number;
  comparison_to_population: PopulationComparison;
}

export interface SD3Score {
  machiavellianism: SD3SubscaleScore;
  narcissism: SD3SubscaleScore;
  psychopathy: SD3SubscaleScore;
}

export interface AllScores {
  phq9: PHQ9Score;
  gad7: GAD7Score;
  asrs: ASRSScore;
  aq10: AQ10Score;
  sd3: SD3Score;
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
  section_founder_stress: SurveyResponses;
  section_treatment: SurveyResponses;
  created_at: string;
}

export interface EmailSubmission {
  token: string;
  email: string;
  wants_report: boolean;
  wants_updates: boolean;
}
