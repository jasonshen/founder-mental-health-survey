import {
  scorePHQ9,
  scoreGAD7,
  scoreASRS,
  scoreAQ10,
  scoreDarkTriad,
  computeAllScores,
} from "../scoring";

describe("PHQ-9 Scoring", () => {
  it("scores zero for all 'Not at all'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      responses[`phq9_${i}`] = "Not at all";
    }
    const result = scorePHQ9(responses);
    expect(result.score).toBe(0);
    expect(result.severity).toBe("none");
    expect(result.suicidal_ideation_flagged).toBe(false);
  });

  it("scores maximum for all 'Nearly every day'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) {
      responses[`phq9_${i}`] = "Nearly every day";
    }
    const result = scorePHQ9(responses);
    expect(result.score).toBe(27);
    expect(result.severity).toBe("severe");
    expect(result.suicidal_ideation_flagged).toBe(true);
  });

  it("flags suicidal ideation when Q9 is non-zero", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 8; i++) {
      responses[`phq9_${i}`] = "Not at all";
    }
    responses["phq9_9"] = "Several days";
    const result = scorePHQ9(responses);
    expect(result.score).toBe(1);
    expect(result.suicidal_ideation_flagged).toBe(true);
  });

  it("classifies mild correctly (score 7)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 7; i++) {
      responses[`phq9_${i}`] = "Several days";
    }
    responses["phq9_8"] = "Not at all";
    responses["phq9_9"] = "Not at all";
    const result = scorePHQ9(responses);
    expect(result.score).toBe(7);
    expect(result.severity).toBe("mild");
  });

  it("classifies moderate correctly (score 12)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) {
      responses[`phq9_${i}`] = "More than half the days";
    }
    for (let i = 7; i <= 9; i++) {
      responses[`phq9_${i}`] = "Not at all";
    }
    const result = scorePHQ9(responses);
    expect(result.score).toBe(12);
    expect(result.severity).toBe("moderate");
  });

  it("classifies moderately severe correctly (score 17)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 8; i++) {
      responses[`phq9_${i}`] = "More than half the days";
    }
    responses["phq9_9"] = "Several days";
    const result = scorePHQ9(responses);
    expect(result.score).toBe(17);
    expect(result.severity).toBe("moderately_severe");
  });
});

describe("GAD-7 Scoring", () => {
  it("scores zero for all 'Not at all'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 7; i++) {
      responses[`gad7_${i}`] = "Not at all";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(0);
    expect(result.severity).toBe("none");
  });

  it("scores maximum for all 'Nearly every day'", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 7; i++) {
      responses[`gad7_${i}`] = "Nearly every day";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(21);
    expect(result.severity).toBe("severe");
  });

  it("classifies mild correctly (score 8)", () => {
    const responses: Record<string, string> = {};
    responses["gad7_1"] = "More than half the days";
    for (let i = 2; i <= 7; i++) {
      responses[`gad7_${i}`] = "Several days";
    }
    const result = scoreGAD7(responses);
    expect(result.score).toBe(8);
    expect(result.severity).toBe("mild");
  });

  it("classifies moderate correctly (score 11)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 3; i++) {
      responses[`gad7_${i}`] = "Nearly every day";
    }
    responses["gad7_4"] = "More than half the days";
    for (let i = 5; i <= 7; i++) {
      responses[`gad7_${i}`] = "Not at all";
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
      responses[`asrs_${i}`] = "Never";
    }
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(0);
    expect(result.above_threshold).toBe(false);
  });

  it("flags all 6 items at maximum", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) {
      responses[`asrs_${i}`] = "Very Often";
    }
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(6);
    expect(result.above_threshold).toBe(true);
  });

  it("Q1-3: 'Sometimes' is flagged, 'Rarely' is not", () => {
    const responses: Record<string, string> = {};
    responses["asrs_1"] = "Sometimes";
    responses["asrs_2"] = "Rarely";
    responses["asrs_3"] = "Often";
    responses["asrs_4"] = "Never";
    responses["asrs_5"] = "Never";
    responses["asrs_6"] = "Never";
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(2);
  });

  it("Q4-6: 'Sometimes' is NOT flagged, 'Often' IS flagged", () => {
    const responses: Record<string, string> = {};
    responses["asrs_1"] = "Never";
    responses["asrs_2"] = "Never";
    responses["asrs_3"] = "Never";
    responses["asrs_4"] = "Sometimes";
    responses["asrs_5"] = "Often";
    responses["asrs_6"] = "Very Often";
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(2);
  });

  it("threshold at exactly 4 items", () => {
    const responses: Record<string, string> = {};
    responses["asrs_1"] = "Sometimes";
    responses["asrs_2"] = "Often";
    responses["asrs_3"] = "Very Often";
    responses["asrs_4"] = "Often";
    responses["asrs_5"] = "Never";
    responses["asrs_6"] = "Never";
    const result = scoreASRS(responses);
    expect(result.items_flagged).toBe(4);
    expect(result.above_threshold).toBe(true);
  });
});

describe("Band prevalence", () => {
  it("PHQ-9 score 0 returns 'none' band prevalence (55%)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 9; i++) responses[`phq9_${i}`] = "Not at all";
    expect(scorePHQ9(responses).general_pop_band_pct).toBe(55);
  });

  it("PHQ-9 score 13 returns 'moderate' band prevalence (11%)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) responses[`phq9_${i}`] = "More than half the days"; // 12
    responses["phq9_7"] = "Several days"; // +1 = 13
    for (let i = 8; i <= 9; i++) responses[`phq9_${i}`] = "Not at all";
    const r = scorePHQ9(responses);
    expect(r.score).toBe(13);
    expect(r.severity).toBe("moderate");
    expect(r.general_pop_band_pct).toBe(11);
  });

  it("GAD-7 max score returns 'severe' band prevalence (5%)", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 7; i++) responses[`gad7_${i}`] = "Nearly every day";
    expect(scoreGAD7(responses).general_pop_band_pct).toBe(5);
  });

  it("ASRS exposes general_pop_above_threshold_pct", () => {
    const responses: Record<string, string> = {};
    for (let i = 1; i <= 6; i++) responses[`asrs_${i}`] = "Never";
    expect(scoreASRS(responses).general_pop_above_threshold_pct).toBe(4.5);
  });
});

describe("computeAllScores", () => {
  it("computes all scores together", () => {
    const responses = {
      adhd: Object.fromEntries(
        Array.from({ length: 6 }, (_, i) => [`asrs_${i + 1}`, "Never"])
      ),
      depression: Object.fromEntries(
        Array.from({ length: 9 }, (_, i) => [`phq9_${i + 1}`, "Not at all"])
      ),
      anxiety: Object.fromEntries(
        Array.from({ length: 7 }, (_, i) => [`gad7_${i + 1}`, "Not at all"])
      ),
    };

    const scores = computeAllScores(responses);
    expect(scores.phq9.score).toBe(0);
    expect(scores.gad7.score).toBe(0);
    expect(scores.asrs.items_flagged).toBe(0);
  });
});

describe("AQ-10 Scoring", () => {
  it("returns 0 when no items answered", () => {
    const result = scoreAQ10({});
    expect(result.score).toBe(0);
    expect(result.items_answered).toBe(0);
    expect(result.above_threshold).toBe(false);
  });

  it("scores all items in autism-trait direction = 10/10", () => {
    // Items 1, 7, 8, 10 score on agree; items 2, 3, 4, 5, 6, 9 on disagree.
    const responses: Record<string, string> = {
      aq_1: "Definitely agree",
      aq_2: "Definitely disagree",
      aq_3: "Slightly disagree",
      aq_4: "Definitely disagree",
      aq_5: "Slightly disagree",
      aq_6: "Definitely disagree",
      aq_7: "Slightly agree",
      aq_8: "Definitely agree",
      aq_9: "Definitely disagree",
      aq_10: "Slightly agree",
    };
    const result = scoreAQ10(responses);
    expect(result.score).toBe(10);
    expect(result.items_answered).toBe(10);
    expect(result.above_threshold).toBe(true);
  });

  it("scores 0 when all answers point away from autism traits", () => {
    const responses: Record<string, string> = {
      aq_1: "Definitely disagree",
      aq_2: "Definitely agree",
      aq_3: "Slightly agree",
      aq_4: "Definitely agree",
      aq_5: "Slightly agree",
      aq_6: "Definitely agree",
      aq_7: "Slightly disagree",
      aq_8: "Definitely disagree",
      aq_9: "Definitely agree",
      aq_10: "Slightly disagree",
    };
    const result = scoreAQ10(responses);
    expect(result.score).toBe(0);
    expect(result.items_answered).toBe(10);
    expect(result.above_threshold).toBe(false);
  });

  it("crosses threshold at exactly 6", () => {
    const responses: Record<string, string> = {};
    // Six trait-direction answers, four off-direction.
    for (let i = 1; i <= 6; i++) {
      const reversed = [2, 3, 4, 5, 6, 9].includes(i);
      responses[`aq_${i}`] = reversed
        ? "Definitely disagree"
        : "Definitely agree";
    }
    for (let i = 7; i <= 10; i++) {
      const reversed = [9].includes(i);
      responses[`aq_${i}`] = reversed
        ? "Definitely agree"
        : "Slightly disagree";
    }
    const result = scoreAQ10(responses);
    expect(result.score).toBe(6);
    expect(result.above_threshold).toBe(true);
  });
});

describe("Dirty Dozen Dark Triad Scoring", () => {
  it("returns nulls when nothing answered", () => {
    const result = scoreDarkTriad({});
    expect(result.machiavellianism).toBeNull();
    expect(result.psychopathy).toBeNull();
    expect(result.narcissism).toBeNull();
    expect(result.composite).toBeNull();
    expect(result.items_answered).toBe(0);
  });

  it("computes per-subscale means", () => {
    const responses: Record<string, string> = {
      // Machiavellianism: all "Strongly agree" (5)
      dd_m_1: "Strongly agree",
      dd_m_2: "Strongly agree",
      dd_m_3: "Strongly agree",
      dd_m_4: "Strongly agree",
      // Psychopathy: all "Disagree" (2)
      dd_p_1: "Disagree",
      dd_p_2: "Disagree",
      dd_p_3: "Disagree",
      dd_p_4: "Disagree",
      // Narcissism: mixed -> mean of (4, 4, 3, 3) = 3.5
      dd_n_1: "Agree",
      dd_n_2: "Agree",
      dd_n_3: "Neither agree nor disagree",
      dd_n_4: "Neither agree nor disagree",
    };
    const result = scoreDarkTriad(responses);
    expect(result.machiavellianism).toBeCloseTo(5);
    expect(result.psychopathy).toBeCloseTo(2);
    expect(result.narcissism).toBeCloseTo(3.5);
    expect(result.items_answered).toBe(12);
    // Composite: (5*4 + 2*4 + 3.5*4) / 12 = 42/12 = 3.5
    expect(result.composite).toBeCloseTo(3.5);
  });

  it("ignores blank items in subscale mean", () => {
    const responses: Record<string, string> = {
      dd_m_1: "Strongly agree", // 5
      dd_m_2: "Agree",           // 4
      // dd_m_3, dd_m_4 unanswered
    };
    const result = scoreDarkTriad(responses);
    expect(result.machiavellianism).toBeCloseTo(4.5);
    expect(result.items_answered).toBe(2);
  });
});
