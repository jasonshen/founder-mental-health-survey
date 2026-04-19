-- ============================================================
-- Feature flags (DB-backed, manually toggled via admin page)
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the flags we know we'll use.
INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('founder_cohort_percentiles',
   false,
   'When on, results page shows founder-cohort percentiles for PHQ-9, GAD-7, and ASRS. Flip after N >= 100 submissions.')
ON CONFLICT (key) DO NOTHING;

-- Anon role never touches this — admin page uses service role.
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
