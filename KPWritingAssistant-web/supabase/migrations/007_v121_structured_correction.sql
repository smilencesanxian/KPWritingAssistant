-- ============================================================
-- KP作文宝 v1.2.1 - Migration 007: Structured Correction Fields
-- Adds JSONB columns for structured correction data storage
-- ============================================================

-- ------------------------------------------------------------
-- corrections: Add structured correction output fields
-- ------------------------------------------------------------
ALTER TABLE corrections
ADD COLUMN IF NOT EXISTS scoring_comments JSONB,
ADD COLUMN IF NOT EXISTS correction_steps JSONB,
ADD COLUMN IF NOT EXISTS structured_suggestions JSONB;

-- Add indexes for potential JSONB queries
CREATE INDEX IF NOT EXISTS idx_corrections_scoring_comments ON corrections USING GIN (scoring_comments);
CREATE INDEX IF NOT EXISTS idx_corrections_correction_steps ON corrections USING GIN (correction_steps);
CREATE INDEX IF NOT EXISTS idx_corrections_structured_suggestions ON corrections USING GIN (structured_suggestions);
