import { scorePHQ9, scoreGAD7, scoreASRS, scoreAQ10, scoreSD3, computeAllScores } from "../scoring";

describe("PHQ-9 Scoring", () => {
  it("scores zero for all 'Not at all'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      responses[`dep_phq9_${i}`] = "Not at all";
    }
    const result = scorePHQ9(responses);
    expect(result.score).toBe(0);
    expect(result.severity).toBe("none");
    expect(result.suicidal_ideation_flagged).toBe(false);
  });

  it("scores maximum for all 'Nearly every day'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      responses[`dep_phq9_${i}`] = "Nearly every day";
    }
    const result = scorePHQ9(responses);
    expect(result.score).toBe(27);
    expect(result.severity).toBe("severe");
    expect(result.suicidal_ideation_flagged).toBe(true);
  });

  it("flags suicidal ideation when Q9 is non-zero", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 8; i++) {
      responses[`dep_phq9_${i}`] = "Not at all";
    }
    responses["dep_phq9_9"] = "Several days";
    const result = scorePHQ9(responses);
    expect(result.score).toBe(1);
    expect(result.suicidal_ideation_flagged).toBe(true);
  });

  it("classifies mild correctly (score 7)", () => {
    const responses: Record<string, string> = {};
    // 7 questions as "Several days" (1 each), 2 as "Not at all"
    for (let i = 1; i <= 7; i++) {
      responses[`dep_phq9_${i}`] = "Several days";
    }
    responses["dep_phq9_8"] = "Not at all";
    responses["dep_phq9_9"] = "Not at all";
    const result = scorePHQ9(responses);
    expect(result.score).toBe(7);
    expect(result.severity).toBe("mild");
  });

  it("classifies moderate correctly (score 12)", () => {
    const responses: Record<string, string> = {};
    // 6 questions as "More than half the days" (2 each), 3 as "Not at all"
    for (let i = 1; i <= 6; i++) {
      responses[`dep_phq9_${i}`] = "More than half the days";
    }
    for (let i = 7; i <= 9; i++) {
      responses[`dep_phq9_${i}`] = "Not at all";
    }
    const result = scorePHQ9(responses);
    expect(result.score).toBe(12);
    expect(result.severity).toBe("moderate");
  });

  it("classifies moderately severe correctly (score 17)", () => {
    const responses: Record<string, string> = {};
    // 8 questions as "More than half the days" (2 each), 1 as "Several days"
    for (let i = 1; i <= 8; i++) {
      responses[`dep_phq9_${i}`] = "More than half the days";
    }
    responses["dep_phq9_9"] = "Several days";
    const result = scorePHQ9(responses);
    expect(result.score).toBe(17);
    expect(result.severity).toBe("moderately_severe");
  });
});

describe("GAD-7 Scoring", () => {
  it("scores zero for all 'Not at all'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 7; i++) {
      responses[`anx_gad7_${i}`] = "Not at all";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(0);
    expect(result.severity).toBe("none");
  });

  it("scores maximum for all 'Nearly every day'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 7; i++) {
      responses[`anx_gad7_${i}`] = "Nearly every day";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(21);
    expect(result.severity).toBe("severe");
  });

  it("classifies mild correctly (score 8)", () => {
    const responses: Record<string, string> = {};
    // 1 "More than half" (2) + 6 "Several days" (1 each) = 8
    responses["anx_gad7_1"] = "More than half the days";
    for (let i = 2; i <= 7; i++) {
      responses[`anx_gad7_${i}`] = "Several days";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(8);
    expect(result.severity).toBe("mild");
  });

  it("classifies moderate correctly (score 11)", () => {
    const responses: Record<string, string> = {};
    // 4 "Nearly every day" (3 each) = 12, minus 1 = 11
    for (let i = 1; i <= 3; i++) {
      responses[`anx_gad7_${i}`] = "Nearly every day";
    }
    responses["anx_gad7_4"] = "More than half the days";
    for (let i = 5; i <= 7; i++) {
      responses[`anx_gad7_${i}`] = "Not at all";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(11);
    expect(result.severity).toBe("moderate");
  });
});

describe("ASRS Scoring (ADHD)", () => {
  it("flags 0 items when all 'Never'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) {
      responses[`adhd_asrs_${i}`] = "Never";
    }
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(0);
    expect(result.above_threshold).toBe(false);
  });

  it("flags all 6 items at maximum", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) {
      responses[`adhd_asrs_${i}`] = "Very Often";
    }
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(6);
    expect(result.above_threshold).toBe(true);
  });

  it("Q1-3: 'Sometimes' is flagged, 'Rarely' is not", () => {
    const responses: Record<string, string> = {};
    responses["adhd_asrs_1"] = "Sometimes"; // flagged
    responses["adhd_asrs_2"] = "Rarely";     // not flagged
    responses["adhd_asrs_3"] = "Often";      // flagged
    responses["adhd_asrs_4"] = "Never";
    responses["adhd_asrs_5"] = "Never";
    responses["adhd_asrs_6"] = "Never";
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(2);
  });

  it("Q4-6: 'Sometimes' is NOT flagged, 'Often' IS flagged", () => {
    const responses: Record<string, string> = {};
    responses["adhd_asrs_1"] = "Never";
    responses["adhd_asrs_2"] = "Never";
    responses["adhd_asrs_3"] = "Never";
    responses["adhd_asrs_4"] = "Sometimes"; // NOT flagged for Q4-6
    responses["adhd_asrs_5"] = "Often";      // flagged
    responses["adhd_asrs_6"] = "Very Often"; // flagged
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(2);
  });

  it("threshold at exactly 4 items", () => {
    const responses: Record<string, string> = {};
    responses["adhd_asrs_1"] = "Sometimes"; // flagged
    responses["adhd_asrs_2"] = "Often";      // flagged
    responses["adhd_asrs_3"] = "Very Often"; // flagged
    responses["adhd_asrs_4"] = "Often";      // flagged
    responses["adhd_asrs_5"] = "Never";
    responses["adhd_asrs_6"] = "Never";
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(4);
    expect(result.above_threshold).toBe(true);
  });
});

describe("AQ-10 Scoring (Autism)", () => {
  it("scores 0 when all answers are non-autistic direction", () => {
    const responses: Record<string, string> = {};
    // Items 1,7,8,10: disagree = 0 points
    for (const num of [1, 7, 8, 10]) {
      responses[`autism_aq10_${num}`] = "Definitely Disagree";
    }
    // Items 2,3,4,5,6,9 (reverse): agree = 0 points
    for (const num of [2, 3, 4, 5, 6, 9]) {
      responses[`autism_aq10_${num}`] = "Definitely Agree";
    }
    const result = scoreAQ10(responses);
    expect(result.score).toBe(0);
    expect(result.above_threshold).toBe(false);
  });

  it("scores 10 when all answers are autistic direction", () => {
    const responses: Record<string, string> = {};
    // Items 1,7,8,10: agree = 1 point each
    for (const num of [1, 7, 8, 10]) {
      responses[`autism_aq10_${num}`] = "Definitely Agree";
    }
    // Items 2,3,4,5,6,9 (reverse): disagree = 1 point each
    for (const num of [2, 3, 4, 5, 6, 9]) {
      responses[`autism_aq10_${num}`] = "Definitely Disagree";
    }
    const result = scoreAQ10(responses);
    expect(result.score).toBe(10);
    expect(result.above_threshold).toBe(true);
  });

  it("slightly agree/disagree also count", () => {
    const responses: Record<string, string> = {};
    responses["autism_aq10_1"] = "Slightly Agree"; // 1 point
    responses["autism_aq10_2"] = "Slightly Disagree"; // 1 point (reverse)
    responses["autism_aq10_3"] = "Slightly Agree"; // 0 (reverse, agree = no point)
    for (const num of [4, 5, 6, 7, 8, 9, 10]) {
      responses[`autism_aq10_${num}`] = "Slightly Agree";
    }
    // Items 4,5,6,9 are reverse: "Slightly Agree" = 0 points
    // Items 7,8,10 are regular: "Slightly Agree" = 1 point each
    const result = scoreAQ10(responses);
    // 1(q1) + 1(q2 reverse disagree) + 0(q3 reverse agree) + 0(q4) + 0(q5) + 0(q6) + 1(q7) + 1(q8) + 0(q9) + 1(q10) = 5
    expect(result.score).toBe(5);
    expect(result.above_threshold).toBe(false);
  });
});

describe("SD3 Scoring (Dark Triad)", () => {
  it("scores all 3s (neutral) as average", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      responses[`sd3_mach_${i}`] = "Neither Agree nor Disagree";
      responses[`sd3_narc_${i}`] = "Neither Agree nor Disagree";
      responses[`sd3_psych_${i}`] = "Neither Agree nor Disagree";
    }
    const result = scoreSD3(responses);
    expect(result.machiavellianism.mean).toBe(3);
    expect(result.narcissism.mean).toBe(3);
    expect(result.psychopathy.mean).toBe(3);
    expect(result.machiavellianism.comparison_to_population).toBe("average");
    expect(result.narcissism.comparison_to_population).toBe("average");
    expect(result.psychopathy.comparison_to_population).toBe("above_average");
  });

  it("handles reverse scoring for narcissism", () => {
    const responses: Record<string, string> = {};
    // All "Strongly Agree" (5) for narcissism
    for (let i = 1; i <= 9; i++) {
      responses[`sd3_narc_${i}`] = "Strongly Agree";
      responses[`sd3_mach_${i}`] = "Neither Agree nor Disagree";
      responses[`sd3_psych_${i}`] = "Neither Agree nor Disagree";
    }
    const result = scoreSD3(responses);
    // Items 2, 6, 8 are reverse: 5 -> 6-5 = 1
    // Items 1,3,4,5,7,9: 5 each (6 items = 30)
    // Items 2,6,8: 1 each (3 items = 3)
    // Total: 33, mean: 33/9 = 3.67
    expect(result.narcissism.mean).toBeCloseTo(3.67, 1);
    expect(result.narcissism.comparison_to_population).toBe("above_average");
  });

  it("handles reverse scoring for psychopathy", () => {
    const responses: Record<string, string> = {};
    // All "Strongly Disagree" (1) for psychopathy
    for (let i = 1; i <= 9; i++) {
      responses[`sd3_psych_${i}`] = "Strongly Disagree";
      responses[`sd3_mach_${i}`] = "Neither Agree nor Disagree";
      responses[`sd3_narc_${i}`] = "Neither Agree nor Disagree";
    }
    const result = scoreSD3(responses);
    // Items 2, 7 are reverse: 1 -> 6-1 = 5
    // Items 1,3,4,5,6,8,9: 1 each (7 items = 7)
    // Items 2,7: 5 each (2 items = 10)
    // Total: 17, mean: 17/9 = 1.89
    expect(result.psychopathy.mean).toBeCloseTo(1.89, 1);
    // 1.89 > 2.09 - 0.5*0.63 = 1.775 → still "average"
    expect(result.psychopathy.comparison_to_population).toBe("average");
  });

  it("classifies below_average correctly", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      responses[`sd3_mach_${i}`] = "Strongly Disagree"; // mean 1.0
      responses[`sd3_narc_${i}`] = "Neither Agree nor Disagree";
      responses[`sd3_psych_${i}`] = "Neither Agree nor Disagree";
    }
    const result = scoreSD3(responses);
    // Mach mean 1.0, pop mean 3.10, SD 0.69
    // 1.0 < 3.10 - 0.345 = 2.755 → below_average
    expect(result.machiavellianism.comparison_to_population).toBe("below_average");
  });
});

describe("computeAllScores", () => {
  it("computes all scores together", () => {
    const responses = {
      depression: Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [`dep_phq9_${i + 1}`, "Not at all"])
      ),
      anxiety: Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => [`anx_gad7_${i + 1}`, "Not at all"])
      ),
      adhd: Object.fromEntries(
        Array.from({ length: 6 }, (_, i) => [`adhd_asrs_${i + 1}`, "Never"])
      ),
      autism: Object.fromEntries([
        ...([1, 7, 8, 10].map(n => [`autism_aq10_${n}`, "Definitely Disagree"])),
        ...([2, 3, 4, 5, 6, 9].map(n => [`autism_aq10_${n}`, "Definitely Agree"])),
      ]),
      dark_triad: Object.fromEntries([
        ...Array.from({ length: 9 }, (_, i) => [`sd3_mach_${i + 1}`, "Neither Agree nor Disagree"]),
        ...Array.from({ length: 9 }, (_, i) => [`sd3_narc_${i + 1}`, "Neither Agree nor Disagree"]),
        ...Array.from({ length: 9 }, (_, i) => [`sd3_psych_${i + 1}`, "Neither Agree nor Disagree"]),
      ]),
    };

    const scores = computeAllScores(responses);
    expect(scores.phq9.score).toBe(0);
    expect(scores.gad7.score).toBe(0);
    expect(scores.asrs.items_flagged).toBe(0);
    expect(scores.aq10.score).toBe(0);
    expect(scores.sd3.machiavellianism.mean).toBe(3);
  });
});
