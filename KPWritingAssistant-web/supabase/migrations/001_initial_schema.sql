-- ============================================================
-- KP作文宝 - Initial Schema Migration
-- ============================================================

-- essay_submissions table
CREATE TABLE IF NOT EXISTS essay_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  original_image_path TEXT,
  ocr_text TEXT,
  title TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- corrections table
CREATE TABLE IF NOT EXISTS corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES essay_submissions UNIQUE NOT NULL,
  content_score INT2,
  communication_score INT2,
  language_score INT2,
  total_score INT2,
  error_annotations JSONB DEFAULT '[]',
  overall_comment TEXT,
  improvement_suggestions TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- model_essays table
CREATE TABLE IF NOT EXISTS model_essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correction_id UUID REFERENCES corrections NOT NULL,
  target_level TEXT CHECK (target_level IN ('pass', 'good', 'excellent')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- highlights_library table
CREATE TABLE IF NOT EXISTS highlights_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  text TEXT NOT NULL,
  type TEXT CHECK (type IN ('vocabulary', 'phrase', 'sentence')),
  source_submission_id UUID REFERENCES essay_submissions,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- error_points table
CREATE TABLE IF NOT EXISTS error_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  error_type TEXT NOT NULL,
  error_type_label TEXT NOT NULL,
  occurrence_count INT DEFAULT 1,
  is_flagged BOOLEAN DEFAULT false,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, error_type)
);

-- error_instances table
CREATE TABLE IF NOT EXISTS error_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_point_id UUID REFERENCES error_points NOT NULL,
  submission_id UUID REFERENCES essay_submissions NOT NULL,
  original_sentence TEXT,
  corrected_sentence TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- copybooks table
CREATE TABLE IF NOT EXISTS copybooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  model_essay_id UUID REFERENCES model_essays NOT NULL,
  font_style TEXT DEFAULT 'gochi-hand',
  pdf_storage_path TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON essay_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON essay_submissions (status);
CREATE INDEX IF NOT EXISTS idx_corrections_submission_id ON corrections (submission_id);
CREATE INDEX IF NOT EXISTS idx_model_essays_correction_id ON model_essays (correction_id);
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights_library (user_id);
CREATE INDEX IF NOT EXISTS idx_highlights_type ON highlights_library (type);
CREATE INDEX IF NOT EXISTS idx_error_points_user_id ON error_points (user_id);
CREATE INDEX IF NOT EXISTS idx_error_points_flagged ON error_points (is_flagged);
CREATE INDEX IF NOT EXISTS idx_error_instances_error_point ON error_instances (error_point_id);
CREATE INDEX IF NOT EXISTS idx_copybooks_user_id ON copybooks (user_id);
CREATE INDEX IF NOT EXISTS idx_copybooks_model_essay ON copybooks (model_essay_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE essay_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE copybooks ENABLE ROW LEVEL SECURITY;

-- essay_submissions policies
CREATE POLICY "Users can select own submissions"
  ON essay_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON essay_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON essay_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON essay_submissions FOR DELETE
  USING (auth.uid() = user_id);

-- corrections policies (access via submission ownership)
CREATE POLICY "Users can select own corrections"
  ON corrections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM essay_submissions s
      WHERE s.id = corrections.submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own corrections"
  ON corrections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM essay_submissions s
      WHERE s.id = corrections.submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own corrections"
  ON corrections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM essay_submissions s
      WHERE s.id = corrections.submission_id AND s.user_id = auth.uid()
    )
  );

-- corrections DELETE policy (needed for cascade delete)
CREATE POLICY "Users can delete own corrections"
  ON corrections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM essay_submissions s
      WHERE s.id = corrections.submission_id AND s.user_id = auth.uid()
    )
  );

-- model_essays policies (access via correction → submission ownership)
CREATE POLICY "Users can select own model essays"
  ON model_essays FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corrections c
      JOIN essay_submissions s ON s.id = c.submission_id
      WHERE c.id = model_essays.correction_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own model essays"
  ON model_essays FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corrections c
      JOIN essay_submissions s ON s.id = c.submission_id
      WHERE c.id = model_essays.correction_id AND s.user_id = auth.uid()
    )
  );

-- model_essays DELETE policy (needed for cascade delete)
CREATE POLICY "Users can delete own model essays"
  ON model_essays FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM corrections c
      JOIN essay_submissions s ON s.id = c.submission_id
      WHERE c.id = model_essays.correction_id AND s.user_id = auth.uid()
    )
  );

-- highlights_library policies
CREATE POLICY "Users can select own highlights"
  ON highlights_library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights"
  ON highlights_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights"
  ON highlights_library FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights"
  ON highlights_library FOR DELETE
  USING (auth.uid() = user_id);

-- error_points policies
CREATE POLICY "Users can select own error points"
  ON error_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own error points"
  ON error_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own error points"
  ON error_points FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own error points"
  ON error_points FOR DELETE
  USING (auth.uid() = user_id);

-- error_instances policies (access via error_point ownership)
CREATE POLICY "Users can select own error instances"
  ON error_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM error_points ep
      WHERE ep.id = error_instances.error_point_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own error instances"
  ON error_instances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM error_points ep
      WHERE ep.id = error_instances.error_point_id AND ep.user_id = auth.uid()
    )
  );

-- error_instances DELETE policy (needed for cascade delete)
CREATE POLICY "Users can delete own error instances"
  ON error_instances FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM error_points ep
      WHERE ep.id = error_instances.error_point_id AND ep.user_id = auth.uid()
    )
  );

-- copybooks policies
CREATE POLICY "Users can select own copybooks"
  ON copybooks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own copybooks"
  ON copybooks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own copybooks"
  ON copybooks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own copybooks"
  ON copybooks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Storage Buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('essay-images', 'essay-images', false),
  ('copybook-pdfs', 'copybook-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- essay-images: private bucket - only the owner can access their files
CREATE POLICY "Users can upload own essay images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'essay-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own essay images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'essay-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own essay images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'essay-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- copybook-pdfs: public bucket - anyone can read, only owner can write
CREATE POLICY "Users can upload own copybook PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'copybook-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view copybook PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'copybook-pdfs');

CREATE POLICY "Users can delete own copybook PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'copybook-pdfs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
