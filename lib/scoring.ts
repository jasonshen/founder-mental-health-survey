import {
  AllScores,
  PHQ9Score,
  PHQ9Severity,
  GAD7Score,
  GAD7Severity,
  ASRSScore,
  AQ10Score,
  SD3Score,
  PopulationComparison,
  SurveyResponses,
} from "./types";
import {
  PHQ9_PERCENTILES,
  GAD7_PERCENTILES,
  ASRS_PERCENTILES,
  ASRS_THRESHOLD,
  AQ10_PERCENTILES,
  AQ10_THRESHOLD,
  SD3_NORMS,
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
    "dep_phq9_1", "dep_phq9_2", "dep_phq9_3", "dep_phq9_4", "dep_phq9_5",
    "dep_phq9_6", "dep_phq9_7", "dep_phq9_8", "dep_phq9_9",
  ];

  let score = 0;
  for (const qId of questionIds) {
    const answer = responses[qId] as string;
    score += PHQ9_OPTION_VALUES[answer] ?? 0;
  }

  const q9Answer = responses["dep_phq9_9"] as string;
  const q9Value = PHQ9_OPTION_VALUES[q9Answer] ?? 0;

  return {
    score,
    severity: getPHQ9Severity(score),
    percentile_general: PHQ9_PERCENTILES[score] ?? 100,
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
    "anx_gad7_1", "anx_gad7_2", "anx_gad7_3", "anx_gad7_4",
    "anx_gad7_5", "anx_gad7_6", "anx_gad7_7",
  ];

  let score = 0;
  for (const qId of questionIds) {
    const answer = responses[qId] as string;
    score += GAD7_OPTION_VALUES[answer] ?? 0;
  }

  return {
    score,
    severity: getGAD7Severity(score),
    percentile_general: GAD7_PERCENTILES[score] ?? 100,
  };
}

// ============================================================
// ASRS-v1.1 Part A Scoring (ADHD)
// ============================================================

// Questions 1-3: flagged if "Sometimes", "Often", or "Very Often"
// Questions 4-6: flagged if "Often" or "Very Often"
const ASRS_Q1_3_FLAGGED = ["Sometimes", "Often", "Very Often"];
const ASRS_Q4_6_FLAGGED = ["Often", "Very Often"];

export function scoreASRS(responses: SurveyResponses): ASRSScore {
  const q1to3 = ["adhd_asrs_1", "adhd_asrs_2", "adhd_asrs_3"];
  const q4to6 = ["adhd_asrs_4", "adhd_asrs_5", "adhd_asrs_6"];

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
    percentile_general: ASRS_PERCENTILES[itemsFlagged] ?? 100,
  };
}

// ============================================================
// AQ-10 Scoring (Autism)
// ============================================================

// Items 1, 7, 8, 10: score 1 for "Definitely Agree" or "Slightly Agree"
// Items 2, 3, 4, 5, 6, 9 (reverse): score 1 for "Slightly Disagree" or "Definitely Disagree"
const AQ10_AGREE_SCORED = [1, 7, 8, 10];
const AQ10_DISAGREE_SCORED = [2, 3, 4, 5, 6, 9];
const AGREE_OPTIONS = ["Definitely Agree", "Slightly Agree"];
const DISAGREE_OPTIONS = ["Slightly Disagree", "Definitely Disagree"];

export function scoreAQ10(responses: SurveyResponses): AQ10Score {
  let score = 0;

  for (const itemNum of AQ10_AGREE_SCORED) {
    const answer = responses[`autism_aq10_${itemNum}`] as string;
    if (AGREE_OPTIONS.includes(answer)) {
      score++;
    }
  }

  for (const itemNum of AQ10_DISAGREE_SCORED) {
    const answer = responses[`autism_aq10_${itemNum}`] as string;
    if (DISAGREE_OPTIONS.includes(answer)) {
      score++;
    }
  }

  return {
    score,
    above_threshold: score >= AQ10_THRESHOLD,
    percentile_general: AQ10_PERCENTILES[score] ?? 100,
  };
}

// ============================================================
// SD3 Scoring (Short Dark Triad)
// ============================================================

const SD3_LIKERT_VALUES: Record<string, number> = {
  "Strongly Disagree": 1,
  "Disagree": 2,
  "Neither Agree nor Disagree": 3,
  "Agree": 4,
  "Strongly Agree": 5,
};

// Reverse scored items (value becomes 6 - value)
const SD3_REVERSE_ITEMS = {
  narcissism: [2, 6, 8],
  psychopathy: [2, 7],
};

function computeSD3Subscale(
  responses: SurveyResponses,
  prefix: string,
  reverseItems: number[]
): number {
  let total = 0;
  for (let i = 1; i <= 9; i++) {
    const answer = responses[`${prefix}_${i}`] as string;
    let value = SD3_LIKERT_VALUES[answer] ?? 3;
    if (reverseItems.includes(i)) {
      value = 6 - value;
    }
    total += value;
  }
  return total / 9;
}

function compareToPopulation(
  mean: number,
  popMean: number,
  popSD: number
): PopulationComparison {
  if (mean < popMean - 0.5 * popSD) return "below_average";
  if (mean > popMean + 0.5 * popSD) return "above_average";
  return "average";
}

export function scoreSD3(responses: SurveyResponses): SD3Score {
  const machMean = computeSD3Subscale(responses, "sd3_mach", []);
  const narcMean = computeSD3Subscale(responses, "sd3_narc", SD3_REVERSE_ITEMS.narcissism);
  const psychMean = computeSD3Subscale(responses, "sd3_psych", SD3_REVERSE_ITEMS.psychopathy);

  return {
    machiavellianism: {
      mean: Math.round(machMean * 100) / 100,
      comparison_to_population: compareToPopulation(
        machMean, SD3_NORMS.machiavellianism.mean, SD3_NORMS.machiavellianism.sd
      ),
    },
    narcissism: {
      mean: Math.round(narcMean * 100) / 100,
      comparison_to_population: compareToPopulation(
        narcMean, SD3_NORMS.narcissism.mean, SD3_NORMS.narcissism.sd
      ),
    },
    psychopathy: {
      mean: Math.round(psychMean * 100) / 100,
      comparison_to_population: compareToPopulation(
        psychMean, SD3_NORMS.psychopathy.mean, SD3_NORMS.psychopathy.sd
      ),
    },
  };
}

// ============================================================
// Compute All Scores
// ============================================================

export function computeAllScores(responses: {
  depression: SurveyResponses;
  anxiety: SurveyResponses;
  adhd: SurveyResponses;
  autism: SurveyResponses;
  dark_triad: SurveyResponses;
}): AllScores {
  return {
    phq9: scorePHQ9(responses.depression),
    gad7: scoreGAD7(responses.anxiety),
    asrs: scoreASRS(responses.adhd),
    aq10: scoreAQ10(responses.autism),
    sd3: scoreSD3(responses.dark_triad),
  };
}
