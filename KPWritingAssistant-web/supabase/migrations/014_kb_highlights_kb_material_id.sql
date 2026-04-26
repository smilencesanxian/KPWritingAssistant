-- ============================================================
-- Migration 014: Add kb_material_id to highlights_library
-- Allows linking user highlights to the new kb_materials table
-- ============================================================

ALTER TABLE highlights_library
ADD COLUMN IF NOT EXISTS kb_material_id UUID REFERENCES kb_materials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_highlights_kb_material_id ON highlights_library (kb_material_id);
