// ============================================================
// V3 — Expanded Survey Types (18 sections)
// ============================================================

export type QuestionType =
  | "likert4" // PHQ-9, GAD-7, AQ-10
  | "likert5" // ASRS, ambition, founder challenges, macro outlook, cofounder, dark triad
  | "likert6_freq" // substance use frequency (Never → Daily or near-daily)
  | "likert7" // MBI-GS burnout frequency (Never → Every day)
  | "scale_0_10" // life outlook, cofounder overall
  | "yes_no"
  | "yes_no_sometimes"
  | "yes_no_prefernot"
  | "single_select"
  | "dropdown"
  | "multi_select"
  | "number"
  | "number_bounded"
  | "text"
  | "text_long";

export type SectionId =
  // V2 existing columns
  | "company"
  | "adhd"
  | "depression"
  | "anxiety"
  | "founder_stress"
  // V3 new sections (stored in sections_ext JSONB)
  | "life_outlook"
  | "ambition"
  | "founder_challenges"
  | "macro_outlook"
  | "cofounder"
  | "burnout"
  | "autism"
  | "dark_triad"
  | "social_support"
  | "help_seeking"
  | "medication"
  | "substance_use"
  | "open_ended";

// Every section maps 1:1 to its own JSONB column on survey_responses.
// This is an allowlist — dynamic column writes in API routes look up
// the column name through this map, which is safe because the set of
// keys is closed and hardcoded.
export const SECTION_COLUMN: Record<SectionId, string> = {
  company: "section_company",
  life_outlook: "section_life_outlook",
  ambition: "section_ambition",
  founder_challenges: "section_founder_challenges",
  macro_outlook: "section_macro_outlook",
  cofounder: "section_cofounder",
  depression: "section_depression",
  anxiety: "section_anxiety",
  burnout: "section_burnout",
  adhd: "section_adhd",
  autism: "section_autism",
  dark_triad: "section_dark_triad",
  social_support: "section_social_support",
  help_seeking: "section_help_seeking",
  medication: "section_medication",
  substance_use: "section_substance_use",
  open_ended: "section_open_ended",
  founder_stress: "section_founder_stress",
};

export const ALL_SECTION_IDS: SectionId[] = Object.keys(
  SECTION_COLUMN
) as SectionId[];

export type InstrumentId =
  | "PHQ-9"
  | "GAD-7"
  | "ASRS"
  | "MBI-GS"
  | "AQ-10"
  | "DD"
  | "AUDIT-C"
  | null;

export type ResponseValue = string | string[] | number | boolean;

/** Flattened {questionId: value} merged across all sections, used for skip-logic predicates. */
export type FlatResponses = Record<string, ResponseValue>;

export interface Question {
  id: string;
  section: SectionId;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  instrument: InstrumentId;
  /** For scale_0_10: anchor labels at the extremes. */
  anchors?: { left: string; right: string };
  /** For number_bounded. */
  min?: number;
  max?: number;
  /** For text / text_long. */
  maxLength?: number;
  /** Metadata only; analysis-layer scoring flips the sign at compute time. */
  reverseCoded?: boolean;
  /** Sentinel attention-check item. Answer is stored raw; flagged at analysis. */
  attentionCheck?: boolean;
  /** Skip-logic predicate. If returns false, the item is not rendered. */
  condition?: (r: FlatResponses) => boolean;
  /** For follow-up text fields: only show if another question equals value. */
  specifyIf?: { questionId: string; value: string };
}

// ============================================================
// Survey Response Types
// ============================================================

export type SurveyResponses = {
  [questionId: string]: ResponseValue;
};

export interface SurveySubmission {
  token: string;
  /** One entry per section that has any answers. Missing sections are treated as NULL in the DB. */
  responses: Partial<Record<SectionId, SurveyResponses>>;
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

export interface AQ10Score {
  /** 0–10. Each item scores 1 if respondent answered in the autism-trait
   *  direction (agree for non-reversed items, disagree for reversed). */
  score: number;
  items_answered: number;
  /** AQ-10 clinical threshold: ≥6 suggests further evaluation. */
  above_threshold: boolean;
}

export interface DarkTriadScore {
  /** Each subscale: mean of 4 items on a 1–5 Likert. */
  machiavellianism: number | null;
  psychopathy: number | null;
  narcissism: number | null;
  /** Mean of all 12 items. Useful as an overall composite. */
  composite: number | null;
  items_answered: number;
}

export interface AllScores {
  phq9: PHQ9Score;
  gad7: GAD7Score;
  asrs: ASRSScore;
  aq10?: AQ10Score;
  darkTriad?: DarkTriadScore;
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
  section_founder_challenges: SurveyResponses | null;
  /** Legacy V2 column; null for V3 respondents. */
  section_founder_stress: SurveyResponses | null;
  created_at: string;
}

export interface SaveSectionRequest {
  submission_id: string;
  section_id: SectionId;
  responses: SurveyResponses;
}

export interface SaveSectionResponse {
  success: boolean;
  submission_id: string;
  sections_completed: SectionId[];
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
