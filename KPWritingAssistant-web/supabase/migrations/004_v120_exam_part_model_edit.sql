-- ============================================================
-- KP作文宝 v1.2.0 - Migration 004: Core Field Extensions
-- Adds new fields to essay_submissions, model_essays, and highlights_library
-- ============================================================

-- ------------------------------------------------------------
-- essay_submissions: Add exam part and question-related fields
-- ------------------------------------------------------------
ALTER TABLE essay_submissions
ADD COLUMN IF NOT EXISTS exam_part TEXT CHECK (exam_part IN ('part1', 'part2')),
ADD COLUMN IF NOT EXISTS question_type TEXT CHECK (question_type IN ('q1', 'q2')),
ADD COLUMN IF NOT EXISTS question_image_path TEXT,
ADD COLUMN IF NOT EXISTS question_ocr_text TEXT,
ADD COLUMN IF NOT EXISTS essay_topic TEXT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_submissions_exam_part ON essay_submissions (exam_part);
CREATE INDEX IF NOT EXISTS idx_submissions_question_type ON essay_submissions (question_type);
CREATE INDEX IF NOT EXISTS idx_submissions_essay_topic ON essay_submissions (essay_topic);

-- ------------------------------------------------------------
-- model_essays: Add user editing-related fields
-- ------------------------------------------------------------
ALTER TABLE model_essays
ADD COLUMN IF NOT EXISTS user_edited_content TEXT,
ADD COLUMN IF NOT EXISTS is_user_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS user_preference_notes TEXT;

-- Add index for user_edited flag
CREATE INDEX IF NOT EXISTS idx_model_essays_is_user_edited ON model_essays (is_user_edited);

-- ------------------------------------------------------------
-- highlights_library: Add source tracking and recommended phrase reference
-- ------------------------------------------------------------
ALTER TABLE highlights_library
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user' CHECK (source IN ('user', 'system')),
ADD COLUMN IF NOT EXISTS recommended_phrase_id UUID;

-- Add index for source filtering
CREATE INDEX IF NOT EXISTS idx_highlights_source ON highlights_library (source);
CREATE INDEX IF NOT EXISTS idx_highlights_recommended_phrase_id ON highlights_library (recommended_phrase_id);
