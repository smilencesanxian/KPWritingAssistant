-- ============================================================
-- Migration: Add organization_score to corrections table
-- ============================================================

-- Add organization_score column to corrections table
ALTER TABLE corrections
ADD COLUMN IF NOT EXISTS organization_score INT2;

-- Add comment to explain the column
COMMENT ON COLUMN corrections.organization_score IS 'PET评分-组织维度 (0-5分)';
