import {
  AllScores,
  PHQ9Score,
  PHQ9Severity,
  GAD7Score,
  GAD7Severity,
  ASRSScore,
  AQ10Score,
  DarkTriadScore,
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
// AQ-10 Scoring (Autism spectrum traits)
// ============================================================

// Items 1, 7, 8, 10 score 1 point if respondent agrees ("Definitely agree"
// or "Slightly agree"). Items 2, 3, 4, 5, 6, 9 score 1 point if respondent
// disagrees ("Definitely disagree" or "Slightly disagree"). Score range 0-10.
// Threshold ≥6 suggests further evaluation (Allison et al., 2012).
const AQ_AGREE_DIRECTION = ["Definitely agree", "Slightly agree"];
const AQ_DISAGREE_DIRECTION = ["Definitely disagree", "Slightly disagree"];
const AQ_REVERSED_ITEMS = new Set([2, 3, 4, 5, 6, 9]);
const AQ10_THRESHOLD = 6;

export function scoreAQ10(responses: SurveyResponses): AQ10Score {
  let score = 0;
  let answered = 0;
  for (let i = 1; i <= 10; i++) {
    const answer = responses[`aq_${i}`];
    if (typeof answer !== "string" || answer === "") continue;
    answered++;
    const reversed = AQ_REVERSED_ITEMS.has(i);
    const target = reversed ? AQ_DISAGREE_DIRECTION : AQ_AGREE_DIRECTION;
    if (target.includes(answer)) score++;
  }
  return {
    score,
    items_answered: answered,
    above_threshold: score >= AQ10_THRESHOLD,
  };
}

// ============================================================
// Dirty Dozen Dark Triad Scoring
// ============================================================

const AGREE_5_VALUES: Record<string, number> = {
  "Strongly disagree": 1,
  Disagree: 2,
  "Neither agree nor disagree": 3,
  Agree: 4,
  "Strongly agree": 5,
};

function meanOfItems(
  responses: SurveyResponses,
  ids: string[]
): { mean: number | null; answered: number } {
  let sum = 0;
  let count = 0;
  for (const id of ids) {
    const raw = responses[id];
    if (typeof raw !== "string" || raw === "") continue;
    const v = AGREE_5_VALUES[raw];
    if (typeof v !== "number") continue;
    sum += v;
    count++;
  }
  return {
    mean: count > 0 ? Number((sum / count).toFixed(2)) : null,
    answered: count,
  };
}

export function scoreDarkTriad(responses: SurveyResponses): DarkTriadScore {
  const mach = meanOfItems(responses, ["dd_m_1", "dd_m_2", "dd_m_3", "dd_m_4"]);
  const psyc = meanOfItems(responses, ["dd_p_1", "dd_p_2", "dd_p_3", "dd_p_4"]);
  const narc = meanOfItems(responses, ["dd_n_1", "dd_n_2", "dd_n_3", "dd_n_4"]);
  const all = meanOfItems(responses, [
    "dd_m_1", "dd_m_2", "dd_m_3", "dd_m_4",
    "dd_p_1", "dd_p_2", "dd_p_3", "dd_p_4",
    "dd_n_1", "dd_n_2", "dd_n_3", "dd_n_4",
  ]);
  return {
    machiavellianism: mach.mean,
    psychopathy: psyc.mean,
    narcissism: narc.mean,
    composite: all.mean,
    items_answered: all.answered,
  };
}

// ============================================================
// Compute All Scores
// ============================================================

export function computeAllScores(responses: {
  adhd: SurveyResponses;
  depression: SurveyResponses;
  anxiety: SurveyResponses;
  autism?: SurveyResponses;
  dark_triad?: SurveyResponses;
}): AllScores {
  return {
    phq9: scorePHQ9(responses.depression),
    gad7: scoreGAD7(responses.anxiety),
    asrs: scoreASRS(responses.adhd),
    aq10: scoreAQ10(responses.autism ?? {}),
    darkTriad: scoreDarkTriad(responses.dark_triad ?? {}),
  };
}
