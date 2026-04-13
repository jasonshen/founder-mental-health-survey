-- ============================================================
-- V2 Schema Migration
-- Adds new columns for streamlined survey
-- ============================================================

-- Add new section column for company data
ALTER TABLE survey_responses ADD COLUMN IF NOT EXISTS section_company JSONB;

-- Remove V1-only columns (keep data intact, just nullable)
-- section_demographics, section_adhd, section_autism, section_dark_triad, section_treatment
-- are no longer used but we don't drop them to preserve any V1 data

-- Add new interest columns to email_contacts
ALTER TABLE email_contacts ADD COLUMN IF NOT EXISTS wants_coaching BOOLEAN DEFAULT false;
ALTER TABLE email_contacts ADD COLUMN IF NOT EXISTS wants_retreat BOOLEAN DEFAULT false;
ALTER TABLE email_contacts ADD COLUMN IF NOT EXISTS wants_plant_medicine BOOLEAN DEFAULT false;
