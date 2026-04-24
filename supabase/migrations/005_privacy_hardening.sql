-- ============================================================
-- Privacy Hardening (Tier 1)
--
-- Goal: the schema itself should make de-anonymization structurally
-- harder, not just policy-prohibited.
--
-- Changes:
--   1. Drop email_contacts.anonymous_token. Email and responses now
--      live in separate rows with no join key. Admin can still count
--      subscribers and send generic broadcasts, but cannot look up a
--      subscriber's individual scores.
--   2. Replace TIMESTAMPTZ created_at with DATE in both tables to
--      blunt time-correlation fingerprinting (e.g., "I shared the
--      link in Slack at 3:14pm; the only submission at 3:17pm is X").
--   3. Drop email_contacts.report_sent_at (also a timestamp, also
--      joinable to survey_responses by time). Track send status via
--      logs, not DB.
--
-- ⚠️ DATA LOSS BY DESIGN:
--   • Existing email_contacts rows lose their anonymous_token (we
--     cannot put it back).
--   • Existing timestamps are truncated to date-only.
--
-- After this migration runs, the strongest verifiable claim is:
--   "email_contacts has no column containing a token, id, or join
--    key to survey_responses. Read the schema yourself."
-- ============================================================

-- 1. Drop the join key from email_contacts.
--    First drop the foreign-key-referencing index if it exists.
DROP INDEX IF EXISTS idx_email_contacts_token;

ALTER TABLE email_contacts
  DROP COLUMN IF EXISTS anonymous_token;

-- 2. Drop report_sent_at — another correlation vector, and unused
--    once we stop storing the token. Track sends via log events.
ALTER TABLE email_contacts
  DROP COLUMN IF EXISTS report_sent_at;

-- 3. Coarsen created_at on both tables. Use DATE so time-of-day
--    fingerprinting is impossible.
ALTER TABLE email_contacts
  ALTER COLUMN created_at TYPE DATE USING created_at::date,
  ALTER COLUMN created_at SET DEFAULT CURRENT_DATE;

ALTER TABLE survey_responses
  ALTER COLUMN created_at TYPE DATE USING created_at::date,
  ALTER COLUMN created_at SET DEFAULT CURRENT_DATE;

-- 4. Verify RLS still denies anon SELECT on both tables.
--    (Migration 003 already dropped the permissive SELECT on
--    survey_responses. email_contacts has never allowed anon SELECT.)
--    No-op statements here for documentation.
