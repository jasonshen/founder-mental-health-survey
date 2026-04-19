import { scorePHQ9, scoreGAD7, scoreASRS, computeAllScores } from "../scoring";

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
