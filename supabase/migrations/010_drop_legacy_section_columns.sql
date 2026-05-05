-- ============================================================
-- Drop legacy section columns from survey_responses
--
-- Two section columns survived the V3 expansion as no-op back-compat:
--
--   • section_macro_outlook  — V2 had a 4-item "AI/economy outlook"
--     section. The 2 AI-sentiment items moved into section_life_outlook
--     during the 2026-05-01 redesign; the 2 economy items were dropped.
--     The macro_outlook section meta has condition: () => false in
--     lib/questions.ts and the questions array is empty — no respondent
--     since 2026-05-01 has data here.
--
--   • section_founder_stress — V2's pre-V3 5-item stressor module.
--     Replaced by section_founder_challenges (14 items) in migration
--     006. The legacy column was preserved so that any old V2 row
--     would still render via the fallback path in ResultsDisplay.
--
-- We're clearing all production data alongside this migration, so there
-- are no longer any V2 rows that depend on those columns. Drop them and
-- delete the matching code paths in the same change-set.
-- ============================================================

ALTER TABLE survey_responses
  DROP COLUMN IF EXISTS section_macro_outlook;

ALTER TABLE survey_responses
  DROP COLUMN IF EXISTS section_founder_stress;
