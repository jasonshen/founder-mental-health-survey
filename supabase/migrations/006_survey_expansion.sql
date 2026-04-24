-- ============================================================
-- Survey Expansion (V3)
--
-- Adds support for:
--   • 13 new sections stored keyed under sections_ext JSONB
--   • Section-level partial save so drop-offs become research data
--
-- Rows written by /api/save-section have completed=false and no
-- anonymous_token. /api/submit UPDATEs the same row on finalize,
-- setting token, scores, completed=true.
-- ============================================================

ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS sections_ext           JSONB        NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sections_completed     TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS last_section_completed TEXT,
  ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ;

-- Partial rows have anonymous_token = NULL. Existing UNIQUE constraint on
-- anonymous_token already allows multiple NULLs in Postgres, so no change needed.
-- submission_id UNIQUE (added in 003) is what lets /api/save-section find the
-- existing row on subsequent calls.

CREATE INDEX IF NOT EXISTS survey_responses_sections_ext_gin
  ON survey_responses USING GIN (sections_ext);

CREATE INDEX IF NOT EXISTS survey_responses_incomplete_idx
  ON survey_responses (updated_at)
  WHERE completed = false;
