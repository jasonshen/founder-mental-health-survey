-- ============================================================
-- Allow NULL anonymous_token for partial rows
--
-- /api/save-section inserts in-progress rows before the final
-- submit generates a token. The current NOT NULL constraint
-- blocks those inserts (returns 503), which is why
-- sections_completed and updated_at are empty on completed
-- submissions: the partial-save path never ran successfully.
--
-- Postgres UNIQUE allows multiple NULLs, so finalized rows
-- still cannot collide on tokens.
-- ============================================================

ALTER TABLE survey_responses
  ALTER COLUMN anonymous_token DROP NOT NULL;

-- Add a CHECK so that *completed* rows must still have a token —
-- this preserves the original invariant where it matters.
ALTER TABLE survey_responses
  DROP CONSTRAINT IF EXISTS survey_responses_completed_has_token;

ALTER TABLE survey_responses
  ADD CONSTRAINT survey_responses_completed_has_token
  CHECK (completed = false OR anonymous_token IS NOT NULL);
