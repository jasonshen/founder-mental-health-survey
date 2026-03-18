// Population norm data for percentile computation
// Source citations in each section

// PHQ-9 cumulative percentiles (score -> % of population at or below)
// Source: Kroenke et al., 2001
export const PHQ9_PERCENTILES: Record<number, number> = {
  0: 10, 1: 18, 2: 26, 3: 34, 4: 55,
  5: 62, 6: 68, 7: 73, 8: 78, 9: 82,
  10: 86, 11: 88, 12: 90, 13: 92, 14: 93,
  15: 95, 16: 96, 17: 96.5, 18: 97, 19: 98,
  20: 98.5, 21: 99, 22: 99.2, 23: 99.4, 24: 99.6,
  25: 99.7, 26: 99.8, 27: 100,
};

// GAD-7 cumulative percentiles
// Source: Spitzer et al., 2006
export const GAD7_PERCENTILES: Record<number, number> = {
  0: 15, 1: 25, 2: 35, 3: 48, 4: 60,
  5: 66, 6: 72, 7: 76, 8: 80, 9: 84,
  10: 88, 11: 90, 12: 92, 13: 94, 14: 95,
  15: 96, 16: 97, 17: 97.5, 18: 98, 19: 98.5,
  20: 99, 21: 100,
};

// ASRS cumulative percentiles (items flagged -> % at or below)
// Source: Kessler et al., 2005; WHO World Mental Health Survey
export const ASRS_PERCENTILES: Record<number, number> = {
  0: 60, 1: 75, 2: 85, 3: 95.5, 4: 97, 5: 99, 6: 100,
};

export const ASRS_THRESHOLD = 4;

// AQ-10 cumulative percentiles
// Source: Allison et al., 2012
export const AQ10_PERCENTILES: Record<number, number> = {
  0: 30, 1: 50, 2: 70, 3: 82, 4: 90, 5: 98,
  6: 99, 7: 99.3, 8: 99.6, 9: 99.8, 10: 100,
};

export const AQ10_THRESHOLD = 6;

// SD3 population norms
// Source: Jones & Paulhus, 2014
export const SD3_NORMS = {
  machiavellianism: { mean: 3.10, sd: 0.69 },
  narcissism: { mean: 2.97, sd: 0.64 },
  psychopathy: { mean: 2.09, sd: 0.63 },
};
