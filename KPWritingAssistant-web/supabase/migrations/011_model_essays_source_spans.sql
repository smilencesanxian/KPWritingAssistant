-- Add source span metadata for model essays
ALTER TABLE model_essays
ADD COLUMN IF NOT EXISTS source_spans JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN model_essays.source_spans IS 'Structured provenance spans for model essay highlighting';
