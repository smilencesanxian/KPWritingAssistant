-- ============================================================
-- KP作文宝 v1.2.0 - Migration 005: Recommended Phrases and Writing Guide
-- Creates recommended_phrases and writing_guide_nodes tables with RLS
-- ============================================================

-- ------------------------------------------------------------
-- recommended_phrases: System recommended phrases library
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommended_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('vocabulary', 'phrase', 'sentence')) NOT NULL,
  essay_type TEXT CHECK (essay_type IN ('email', 'article', 'general')),
  topic_tags TEXT[],
  usage_example TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for recommended_phrases
CREATE INDEX IF NOT EXISTS idx_recommended_phrases_type ON recommended_phrases (type);
CREATE INDEX IF NOT EXISTS idx_recommended_phrases_essay_type ON recommended_phrases (essay_type);
CREATE INDEX IF NOT EXISTS idx_recommended_phrases_is_active ON recommended_phrases (is_active);
CREATE INDEX IF NOT EXISTS idx_recommended_phrases_sort_order ON recommended_phrases (sort_order);

-- ------------------------------------------------------------
-- writing_guide_nodes: Writing guide tree structure for users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS writing_guide_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  parent_id UUID REFERENCES writing_guide_nodes,
  node_type TEXT CHECK (node_type IN ('essay_type', 'topic', 'highlight')) NOT NULL,
  label TEXT NOT NULL,
  highlight_id UUID REFERENCES highlights_library,
  source TEXT DEFAULT 'user' CHECK (source IN ('user', 'system')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for writing_guide_nodes
CREATE INDEX IF NOT EXISTS idx_writing_guide_user_id ON writing_guide_nodes (user_id);
CREATE INDEX IF NOT EXISTS idx_writing_guide_parent_id ON writing_guide_nodes (parent_id);
CREATE INDEX IF NOT EXISTS idx_writing_guide_node_type ON writing_guide_nodes (node_type);
CREATE INDEX IF NOT EXISTS idx_writing_guide_highlight_id ON writing_guide_nodes (highlight_id);
CREATE INDEX IF NOT EXISTS idx_writing_guide_source ON writing_guide_nodes (source);

-- ------------------------------------------------------------
-- Add foreign key constraint for highlights_library.recommended_phrase_id
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'highlights_library_recommended_phrase_id_fkey'
    AND table_name = 'highlights_library'
  ) THEN
    ALTER TABLE highlights_library
    ADD CONSTRAINT highlights_library_recommended_phrase_id_fkey
    FOREIGN KEY (recommended_phrase_id) REFERENCES recommended_phrases(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- Row Level Security for recommended_phrases
-- Everyone can read (authenticated or not)
-- ------------------------------------------------------------
ALTER TABLE recommended_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recommended phrases"
  ON recommended_phrases FOR SELECT
  USING (true);

-- ------------------------------------------------------------
-- Row Level Security for writing_guide_nodes
-- Users can only see their own nodes + system nodes (user_id IS NULL)
-- ------------------------------------------------------------
ALTER TABLE writing_guide_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own and system writing guide nodes"
  ON writing_guide_nodes FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert own writing guide nodes"
  ON writing_guide_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own writing guide nodes"
  ON writing_guide_nodes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own writing guide nodes"
  ON writing_guide_nodes FOR DELETE
  USING (auth.uid() = user_id);
