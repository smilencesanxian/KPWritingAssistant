-- Add template_id and mode columns to copybooks table
ALTER TABLE copybooks
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'pet',
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'tracing';

-- Index for cache lookup by model_essay_id + template_id + mode
CREATE INDEX IF NOT EXISTS idx_copybooks_template_mode
  ON copybooks (model_essay_id, user_id, template_id, mode);
