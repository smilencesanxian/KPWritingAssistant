-- Migration 009: Add usage_count to highlights_library
-- Tracks how many times a knowledge item has been injected into model essay generation

ALTER TABLE highlights_library
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN highlights_library.usage_count IS '该知识素材被注入范文生成的次数';
