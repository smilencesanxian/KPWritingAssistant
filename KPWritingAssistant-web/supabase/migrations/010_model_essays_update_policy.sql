-- Allow authenticated users to update their own model essays via
-- correction -> submission ownership. This is required for:
-- 1. 手动编辑范文
-- 2. 重新生成范文后回写 user_edited_content
DROP POLICY IF EXISTS "Users can update own model essays" ON model_essays;

CREATE POLICY "Users can update own model essays"
  ON model_essays FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM corrections c
      JOIN essay_submissions s ON s.id = c.submission_id
      WHERE c.id = model_essays.correction_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM corrections c
      JOIN essay_submissions s ON s.id = c.submission_id
      WHERE c.id = model_essays.correction_id AND s.user_id = auth.uid()
    )
  );
