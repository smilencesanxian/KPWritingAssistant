-- ============================================================
-- KP作文宝 v1.2.0 - Seed Data: Writing Guide System Nodes
-- System default nodes for writing guide tree structure
-- ============================================================

-- Level 0: Essay Type Nodes
INSERT INTO writing_guide_nodes (user_id, parent_id, node_type, label, source, sort_order) VALUES
(NULL, NULL, 'essay_type', '邮件 (Part 1)', 'system', 1),
(NULL, NULL, 'essay_type', '文章 (Part 2)', 'system', 2);

-- Level 1: Topic Nodes under Email (Part 1)
WITH email_node AS (
  SELECT id FROM writing_guide_nodes
  WHERE user_id IS NULL
  AND node_type = 'essay_type'
  AND label = '邮件 (Part 1)'
)
INSERT INTO writing_guide_nodes (user_id, parent_id, node_type, label, source, sort_order)
SELECT NULL, email_node.id, 'topic', '户外活动', 'system', 1 FROM email_node
UNION ALL
SELECT NULL, email_node.id, 'topic', '学校生活', 'system', 2 FROM email_node
UNION ALL
SELECT NULL, email_node.id, 'topic', '日常生活', 'system', 3 FROM email_node;

-- Level 1: Topic Nodes under Article (Part 2)
WITH article_node AS (
  SELECT id FROM writing_guide_nodes
  WHERE user_id IS NULL
  AND node_type = 'essay_type'
  AND label = '文章 (Part 2)'
)
INSERT INTO writing_guide_nodes (user_id, parent_id, node_type, label, source, sort_order)
SELECT NULL, article_node.id, 'topic', '社会话题', 'system', 1 FROM article_node
UNION ALL
SELECT NULL, article_node.id, 'topic', '个人经历', 'system', 2 FROM article_node;

-- Level 2: Sample Highlight Nodes linked to recommended_phrases
-- These will be linked to recommended_phrases via highlight_id after phrases are inserted
-- Note: In a real deployment, you may want to link these to actual recommended_phrases records
