import {
  AllScores,
  PHQ9Score,
  PHQ9Severity,
  GAD7Score,
  GAD7Severity,
  ASRSScore,
  SurveyResponses,
} from "./types";
import {
  PHQ9_BANDS,
  GAD7_BANDS,
  ASRS_GENERAL_POP_ABOVE_THRESHOLD_PCT,
  bandFor,
} from "./norms";

// ============================================================
// PHQ-9 Scoring (Depression)
// ============================================================

const PHQ9_OPTION_VALUES: Record<string, number> = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

function getPHQ9Severity(score: number): PHQ9Severity {
  if (score <= 4) return "none";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  if (score <= 19) return "moderately_severe";
  return "severe";
}

export function scorePHQ9(responses: SurveyResponses): PHQ9Score {
  const questionIds = [
    "phq9_1", "phq9_2", "phq9_3", "phq9_4", "phq9_5",
    "phq9_6", "phq9_7", "phq9_8", "phq9_9",
  ];

  let score = 0;
  for (const qId of questionIds) {
    const answer = responses[qId] as string;
    score += PHQ9_OPTION_VALUES[answer] ?? 0;
  }

  const q9Answer = responses["phq9_9"] as string;
  const q9Value = PHQ9_OPTION_VALUES[q9Answer] ?? 0;

  return {
    score,
    severity: getPHQ9Severity(score),
    general_pop_band_pct: bandFor(PHQ9_BANDS, score)?.population_pct ?? 0,
    suicidal_ideation_flagged: q9Value > 0,
  };
}

// ============================================================
// GAD-7 Scoring (Anxiety)
// ============================================================

const GAD7_OPTION_VALUES: Record<string, number> = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

function getGAD7Severity(score: number): GAD7Severity {
  if (score <= 4) return "none";
  if (score <= 9) return "mild";
  if (score <= 14) return "moderate";
  return "severe";
}

export function scoreGAD7(responses: SurveyResponses): GAD7Score {
  const questionIds = [
    "gad7_1", "gad7_2", "gad7_3", "gad7_4",
    "gad7_5", "gad7_6", "gad7_7",
  ];

  let score = 0;
  for (const qId of questionIds) {
    const answer = responses[qId] as string;
    score += GAD7_OPTION_VALUES[answer] ?? 0;
  }

  return {
    score,
    severity: getGAD7Severity(score),
    general_pop_band_pct: bandFor(GAD7_BANDS, score)?.population_pct ?? 0,
  };
}

// ============================================================
// ASRS-v1.1 Part A Scoring (ADHD)
// ============================================================

// Questions 1-3: flagged if "Sometimes", "Often", or "Very Often"
// Questions 4-6: flagged if "Often" or "Very Often"
const ASRS_Q1_3_FLAGGED = ["Sometimes", "Often", "Very Often"];
const ASRS_Q4_6_FLAGGED = ["Often", "Very Often"];
const ASRS_THRESHOLD = 4;

export function scoreASRS(responses: SurveyResponses): ASRSScore {
  const q1to3 = ["asrs_1", "asrs_2", "asrs_3"];
  const q4to6 = ["asrs_4", "asrs_5", "asrs_6"];

  let itemsFlagged = 0;

  for (const qId of q1to3) {
    const answer = responses[qId] as string;
    if (ASRS_Q1_3_FLAGGED.includes(answer)) {
      itemsFlagged++;
    }
  }

  for (const qId of q4to6) {
    const answer = responses[qId] as string;
    if (ASRS_Q4_6_FLAGGED.includes(answer)) {
      itemsFlagged++;
    }
  }

  return {
    items_flagged: itemsFlagged,
    above_threshold: itemsFlagged >= ASRS_THRESHOLD,
    general_pop_above_threshold_pct: ASRS_GENERAL_POP_ABOVE_THRESHOLD_PCT,
  };
}

// ============================================================
// Compute All Scores
// ============================================================

export function computeAllScores(responses: {
  adhd: SurveyResponses;
  depression: SurveyResponses;
  anxiety: SurveyResponses;
}): AllScores {
  return {
    phq9: scorePHQ9(responses.depression),
    gad7: scoreGAD7(responses.anxiety),
    asrs: scoreASRS(responses.adhd),
  };
}
