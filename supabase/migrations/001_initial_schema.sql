-- ============================================================
-- Founder Mental Health Survey — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Table: survey_responses
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  section_demographics JSONB,
  section_adhd JSONB,
  section_autism JSONB,
  section_dark_triad JSONB,
  section_depression JSONB,
  section_anxiety JSONB,
  section_founder_stress JSONB,
  section_treatment JSONB,
  scores JSONB,
  completed BOOLEAN DEFAULT false
);

-- Table: email_contacts
CREATE TABLE email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_token TEXT NOT NULL REFERENCES survey_responses(anonymous_token),
  email TEXT NOT NULL,
  wants_report BOOLEAN DEFAULT false,
  wants_updates BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  report_sent_at TIMESTAMPTZ
);

-- Table: aggregate_norms
CREATE TABLE aggregate_norms (
  id SERIAL PRIMARY KEY,
  instrument TEXT NOT NULL,
  population TEXT NOT NULL,
  sample_size INTEGER,
  percentile_distribution JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  source TEXT
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aggregate_norms ENABLE ROW LEVEL SECURITY;

-- survey_responses: anon can INSERT (submit survey)
CREATE POLICY "Anyone can submit a survey"
  ON survey_responses FOR INSERT
  TO anon
  WITH CHECK (true);

-- survey_responses: anon can SELECT their own results by token
CREATE POLICY "Anyone can read their own results by token"
  ON survey_responses FOR SELECT
  TO anon
  USING (true);

-- email_contacts: anon can INSERT (submit email)
CREATE POLICY "Anyone can submit their email"
  ON email_contacts FOR INSERT
  TO anon
  WITH CHECK (true);

-- aggregate_norms: anon can read norms (public data)
CREATE POLICY "Anyone can read population norms"
  ON aggregate_norms FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_survey_responses_token ON survey_responses(anonymous_token);
CREATE INDEX idx_email_contacts_token ON email_contacts(anonymous_token);

-- ============================================================
-- Seed: Population Norm Data
-- ============================================================

-- PHQ-9 (Depression) — General Population
INSERT INTO aggregate_norms (instrument, population, sample_size, percentile_distribution, source)
VALUES (
  'PHQ-9',
  'general',
  NULL,
  '{
    "severity_bands": [
      { "range": [0, 4], "label": "none", "display": "None/Minimal", "population_pct": 55 },
      { "range": [5, 9], "label": "mild", "display": "Mild", "population_pct": 27 },
      { "range": [10, 14], "label": "moderate", "display": "Moderate", "population_pct": 11 },
      { "range": [15, 19], "label": "moderately_severe", "display": "Moderately Severe", "population_pct": 5 },
      { "range": [20, 27], "label": "severe", "display": "Severe", "population_pct": 2 }
    ],
    "cumulative_percentiles": {
      "0": 10, "1": 18, "2": 26, "3": 34, "4": 55,
      "5": 62, "6": 68, "7": 73, "8": 78, "9": 82,
      "10": 86, "11": 88, "12": 90, "13": 92, "14": 93,
      "15": 95, "16": 96, "17": 96.5, "18": 97, "19": 98,
      "20": 98.5, "21": 99, "22": 99.2, "23": 99.4, "24": 99.6, "25": 99.7, "26": 99.8, "27": 100
    }
  }'::jsonb,
  'Kroenke et al., 2001; general population screening studies'
);

-- GAD-7 (Anxiety) — General Population
INSERT INTO aggregate_norms (instrument, population, sample_size, percentile_distribution, source)
VALUES (
  'GAD-7',
  'general',
  NULL,
  '{
    "severity_bands": [
      { "range": [0, 4], "label": "none", "display": "None/Minimal", "population_pct": 60 },
      { "range": [5, 9], "label": "mild", "display": "Mild", "population_pct": 24 },
      { "range": [10, 14], "label": "moderate", "display": "Moderate", "population_pct": 11 },
      { "range": [15, 21], "label": "severe", "display": "Severe", "population_pct": 5 }
    ],
    "cumulative_percentiles": {
      "0": 15, "1": 25, "2": 35, "3": 48, "4": 60,
      "5": 66, "6": 72, "7": 76, "8": 80, "9": 84,
      "10": 88, "11": 90, "12": 92, "13": 94, "14": 95,
      "15": 96, "16": 97, "17": 97.5, "18": 98, "19": 98.5,
      "20": 99, "21": 100
    }
  }'::jsonb,
  'Spitzer et al., 2006; general population screening studies'
);

-- ASRS-v1.1 Part A (ADHD) — General Population
INSERT INTO aggregate_norms (instrument, population, sample_size, percentile_distribution, source)
VALUES (
  'ASRS',
  'general',
  NULL,
  '{
    "threshold": 4,
    "threshold_label": "Consistent with ADHD",
    "below_threshold_pct": 95.5,
    "above_threshold_pct": 4.5,
    "cumulative_percentiles": {
      "0": 60, "1": 75, "2": 85, "3": 95.5, "4": 97, "5": 99, "6": 100
    }
  }'::jsonb,
  'Kessler et al., 2005; WHO World Mental Health Survey'
);

-- AQ-10 (Autism) — General Population
INSERT INTO aggregate_norms (instrument, population, sample_size, percentile_distribution, source)
VALUES (
  'AQ-10',
  'general',
  NULL,
  '{
    "threshold": 6,
    "threshold_label": "Consider further assessment",
    "below_threshold_pct": 98,
    "above_threshold_pct": 2,
    "cumulative_percentiles": {
      "0": 30, "1": 50, "2": 70, "3": 82, "4": 90, "5": 98, "6": 99, "7": 99.3, "8": 99.6, "9": 99.8, "10": 100
    }
  }'::jsonb,
  'Allison et al., 2012; general population screening studies'
);

-- SD3 (Short Dark Triad) — General Population
INSERT INTO aggregate_norms (instrument, population, sample_size, percentile_distribution, source)
VALUES (
  'SD3',
  'general',
  NULL,
  '{
    "subscales": {
      "machiavellianism": { "mean": 3.10, "sd": 0.69 },
      "narcissism": { "mean": 2.97, "sd": 0.64 },
      "psychopathy": { "mean": 2.09, "sd": 0.63 }
    }
  }'::jsonb,
  'Jones & Paulhus, 2014'
);
