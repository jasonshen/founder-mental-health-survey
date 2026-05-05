-- ============================================================
-- Reset all respondent data — destructive, one-shot.
--
-- Wipes every row from the two tables that hold respondent data:
--   • survey_responses  — partial + completed survey rows
--   • email_contacts    — email opt-ins and follow-up interest flags
--
-- Does NOT touch:
--   • feature_flags     — operational config (migration 004)
--   • Any schema state  — column definitions, indexes, RLS policies
--
-- TRUNCATE is run as a single transaction with RESTART IDENTITY so any
-- bigserial sequences reset to 1 (this project uses UUID PKs, but the
-- flag is harmless and forward-compatible).
--
-- INTENDED USE: pre-launch cleanup of the dev/test rows accumulated
-- during the survey rebuild. Do NOT run this against production once
-- real respondent data exists — there is no undo.
-- ============================================================

BEGIN;

TRUNCATE TABLE survey_responses, email_contacts RESTART IDENTITY;

COMMIT;
