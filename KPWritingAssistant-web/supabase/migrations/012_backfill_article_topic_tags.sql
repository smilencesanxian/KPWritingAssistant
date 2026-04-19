-- ============================================================
-- KP作文宝 v1.2.x - Migration 012: Backfill article topic_tags
-- Goal:
-- 1) Backfill topic_tags for existing article phrases where text can be inferred.
-- 2) Seed missing article topics to ensure all 7 topic sections can be rendered.
-- ============================================================

-- Step 1: Backfill inferable article topic_tags (idempotent)
UPDATE recommended_phrases
SET topic_tags = ARRAY['reading']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (text ILIKE '%reading%' OR text ILIKE '%book%');

UPDATE recommended_phrases
SET topic_tags = ARRAY['hobby']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (
    text ILIKE '%hobby%'
    OR text ILIKE '%painting%'
    OR text ILIKE '%music%'
    OR text ILIKE '%sports%'
  );

UPDATE recommended_phrases
SET topic_tags = ARRAY['friendship']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (text ILIKE '%friend%' OR text ILIKE '%friendship%');

UPDATE recommended_phrases
SET topic_tags = ARRAY['living_environment']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (
    text ILIKE '%environment%'
    OR text ILIKE '%neighborhood%'
    OR text ILIKE '%neighbourhood%'
  );

UPDATE recommended_phrases
SET topic_tags = ARRAY['admired_person']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (text ILIKE '%admire%' OR text ILIKE '%kind and helpful%');

UPDATE recommended_phrases
SET topic_tags = ARRAY['difficult_thing']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (text ILIKE '%difficult%' OR text ILIKE '%challenge%');

UPDATE recommended_phrases
SET topic_tags = ARRAY['favorite_place']
WHERE essay_type = 'article'
  AND is_active = true
  AND (topic_tags IS NULL OR cardinality(topic_tags) = 0)
  AND (text ILIKE '%place%' OR text ILIKE '%park%');

-- Step 2: Seed missing topic phrases (idempotent)
INSERT INTO recommended_phrases (
  text, type, essay_type, category, level, topic_tags, usage_example, is_active, sort_order
)
SELECT
  'The park near my home is a peaceful place where I can unwind after school.',
  'sentence',
  'article',
  'detail',
  'advanced',
  ARRAY['favorite_place'],
  'The park near my home is a peaceful place where I can unwind after school.',
  true,
  210
WHERE NOT EXISTS (
  SELECT 1 FROM recommended_phrases
  WHERE essay_type = 'article'
    AND text = 'The park near my home is a peaceful place where I can unwind after school.'
);

INSERT INTO recommended_phrases (
  text, type, essay_type, category, level, topic_tags, usage_example, is_active, sort_order
)
SELECT
  'Learning to speak in public is challenging, but it helps me build confidence.',
  'sentence',
  'article',
  'detail',
  'advanced',
  ARRAY['difficult_thing'],
  'Learning to speak in public is challenging, but it helps me build confidence.',
  true,
  211
WHERE NOT EXISTS (
  SELECT 1 FROM recommended_phrases
  WHERE essay_type = 'article'
    AND text = 'Learning to speak in public is challenging, but it helps me build confidence.'
);

INSERT INTO recommended_phrases (
  text, type, essay_type, category, level, topic_tags, usage_example, is_active, sort_order
)
SELECT
  'True friendship means supporting each other in both good and bad times.',
  'sentence',
  'article',
  'detail',
  'advanced',
  ARRAY['friendship'],
  'True friendship means supporting each other in both good and bad times.',
  true,
  212
WHERE NOT EXISTS (
  SELECT 1 FROM recommended_phrases
  WHERE essay_type = 'article'
    AND text = 'True friendship means supporting each other in both good and bad times.'
);

INSERT INTO recommended_phrases (
  text, type, essay_type, category, level, topic_tags, usage_example, is_active, sort_order
)
SELECT
  'A clean and green neighborhood is essential for our health and well-being.',
  'sentence',
  'article',
  'detail',
  'advanced',
  ARRAY['living_environment'],
  'A clean and green neighborhood is essential for our health and well-being.',
  true,
  213
WHERE NOT EXISTS (
  SELECT 1 FROM recommended_phrases
  WHERE essay_type = 'article'
    AND text = 'A clean and green neighborhood is essential for our health and well-being.'
);

INSERT INTO recommended_phrases (
  text, type, essay_type, category, level, topic_tags, usage_example, is_active, sort_order
)
SELECT
  'I admire my grandfather because he is always kind and helpful to others.',
  'sentence',
  'article',
  'detail',
  'advanced',
  ARRAY['admired_person'],
  'I admire my grandfather because he is always kind and helpful to others.',
  true,
  214
WHERE NOT EXISTS (
  SELECT 1 FROM recommended_phrases
  WHERE essay_type = 'article'
    AND text = 'I admire my grandfather because he is always kind and helpful to others.'
);
