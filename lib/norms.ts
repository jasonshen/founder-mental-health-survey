// Severity band prevalence data from primary source studies.
//
// We deliberately do NOT expose per-integer cumulative percentiles. Those require
// assumptions (linear interpolation across bands, etc.) that the primary literature
// doesn't support directly. Band prevalence IS published — it's the honest number
// to show.

export type BandPrevalence = {
  label: string; // internal key
  display: string; // human-readable
  min: number; // score range start (inclusive)
  max: number; // score range end (inclusive)
  population_pct: number; // % of general pop scoring in this band
};

// PHQ-9 — Kroenke, Spitzer, Williams (2001). General population estimates.
export const PHQ9_BANDS: BandPrevalence[] = [
  { label: "none", display: "None/Minimal", min: 0, max: 4, population_pct: 55 },
  { label: "mild", display: "Mild", min: 5, max: 9, population_pct: 27 },
  { label: "moderate", display: "Moderate", min: 10, max: 14, population_pct: 11 },
  { label: "moderately_severe", display: "Moderately Severe", min: 15, max: 19, population_pct: 5 },
  { label: "severe", display: "Severe", min: 20, max: 27, population_pct: 2 },
];

// GAD-7 — Spitzer, Kroenke, Williams, Löwe (2006). General population estimates.
export const GAD7_BANDS: BandPrevalence[] = [
  { label: "none", display: "None/Minimal", min: 0, max: 4, population_pct: 60 },
  { label: "mild", display: "Mild", min: 5, max: 9, population_pct: 24 },
  { label: "moderate", display: "Moderate", min: 10, max: 14, population_pct: 11 },
  { label: "severe", display: "Severe", min: 15, max: 21, population_pct: 5 },
];

// ASRS-v1.1 Part A — Kessler et al. (2005), WHO World Mental Health Survey.
// Binary threshold: 4+ items flagged suggests ADHD. ~4.5% of general pop meets threshold.
export const ASRS_GENERAL_POP_ABOVE_THRESHOLD_PCT = 4.5;

// Helper: find the band a score falls in.
export function bandFor(bands: BandPrevalence[], score: number): BandPrevalence | undefined {
  return bands.find((b) => score >= b.min && score <= b.max);
}
