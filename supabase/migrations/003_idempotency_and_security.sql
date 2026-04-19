-- ============================================================
-- Data Integrity + RLS Hardening
-- ============================================================

-- 1. Idempotency: add submission_id with UNIQUE constraint so double-submits
--    from double-click or network retries resolve to a single row.
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS submission_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_responses_submission_id
  ON survey_responses(submission_id)
  WHERE submission_id IS NOT NULL;

-- 2. Remove the over-permissive anon SELECT policy.
--    The anon key would otherwise allow enumerating every submission.
--    All reads now go through API routes using the service-role key.
DROP POLICY IF EXISTS "Anyone can read their own results by token" ON survey_responses;
