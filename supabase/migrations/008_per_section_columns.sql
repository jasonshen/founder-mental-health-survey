-- ============================================================
-- Per-section column refactor (supersedes sections_ext JSONB)
--
-- Replaces the sections_ext JSONB blob introduced in migration
-- 006 with one JSONB column per section. Motivations:
--   • Cleaner analyst SQL (SELECT section_dark_triad ... vs.
--     sections_ext->'dark_triad')
--   • Schema is self-describing in the Supabase UI
--   • Easier to index individual sections later if needed
--
-- Also drops V1-leftover columns that confused operators looking
-- at rows (they were always NULL for V2/V3 — data lived in
-- section_company for demographics, and in sections_ext for
-- autism / dark_triad). All existing data is test data per
-- operator confirmation, so V1 contents are not preserved.
-- ============================================================

-- 1. Drop V1-leftover columns. section_autism and section_dark_triad
--    overlap with V3 section names; we drop and re-create them fresh
--    so they hold V3 data cleanly.
ALTER TABLE survey_responses DROP COLUMN IF EXISTS section_demographics;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS section_treatment;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS section_autism;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS section_dark_triad;

-- 2. Add 13 V3 section columns. All nullable JSONB — partial rows
--    and items-optional policy both require this.
ALTER TABLE survey_responses
  ADD COLUMN IF NOT EXISTS section_life_outlook       JSONB,
  ADD COLUMN IF NOT EXISTS section_ambition           JSONB,
  ADD COLUMN IF NOT EXISTS section_founder_challenges JSONB,
  ADD COLUMN IF NOT EXISTS section_macro_outlook      JSONB,
  ADD COLUMN IF NOT EXISTS section_cofounder          JSONB,
  ADD COLUMN IF NOT EXISTS section_burnout            JSONB,
  ADD COLUMN IF NOT EXISTS section_autism             JSONB,
  ADD COLUMN IF NOT EXISTS section_dark_triad         JSONB,
  ADD COLUMN IF NOT EXISTS section_social_support     JSONB,
  ADD COLUMN IF NOT EXISTS section_help_seeking       JSONB,
  ADD COLUMN IF NOT EXISTS section_medication         JSONB,
  ADD COLUMN IF NOT EXISTS section_substance_use      JSONB,
  ADD COLUMN IF NOT EXISTS section_open_ended         JSONB;

-- 3. Backfill from the existing sections_ext blob. No-op for rows
--    where the blob is empty or missing the key.
UPDATE survey_responses
SET
  section_life_outlook       = sections_ext->'life_outlook',
  section_ambition           = sections_ext->'ambition',
  section_founder_challenges = sections_ext->'founder_challenges',
  section_macro_outlook      = sections_ext->'macro_outlook',
  section_cofounder          = sections_ext->'cofounder',
  section_burnout            = sections_ext->'burnout',
  section_autism             = sections_ext->'autism',
  section_dark_triad         = sections_ext->'dark_triad',
  section_social_support     = sections_ext->'social_support',
  section_help_seeking       = sections_ext->'help_seeking',
  section_medication         = sections_ext->'medication',
  section_substance_use      = sections_ext->'substance_use',
  section_open_ended         = sections_ext->'open_ended'
WHERE sections_ext IS NOT NULL AND sections_ext <> '{}'::jsonb;

-- 4. Drop the old blob and its GIN index.
DROP INDEX IF EXISTS survey_responses_sections_ext_gin;
ALTER TABLE survey_responses DROP COLUMN IF EXISTS sections_ext;
