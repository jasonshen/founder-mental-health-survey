-- ============================================================
-- Add `cohort` column to survey_responses
--
-- Differentiates YC-specific respondents (entered via /yc) from
-- general founders (entered via /survey). Set by the consent page
-- based on a screener question + URL hint, persisted via the
-- /api/submit and /api/save-section endpoints.
--
-- Existing rows (pre-migration) get NULL. v2 analytics treat
-- NULL as "yc" since the survey was YC-only before this change.
-- ============================================================

ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS cohort TEXT
  CHECK (cohort IS NULL OR cohort IN ('yc', 'general'));

CREATE INDEX IF NOT EXISTS idx_survey_responses_cohort
  ON survey_responses (cohort)
  WHERE completed = TRUE;

COMMENT ON COLUMN survey_responses.cohort IS
  'Cohort the respondent identified with: ''yc'' (entered via /yc landing) or ''general'' (entered via /survey landing). NULL on rows from before the cohort split (treat as ''yc'').';
