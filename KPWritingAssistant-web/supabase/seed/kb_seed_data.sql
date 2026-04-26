-- ============================================================
-- Knowledge Base v2.0 Seed Data
-- Extracted from HTML v2.0
-- ============================================================

-- Step 1: Categories
INSERT INTO kb_categories (slug, label_zh, label_en, description, icon, sort_order) VALUES
  ('email', '邮件', 'Email', '按写作结构归类', '✉️', 1),
  ('article', '文章', 'Article', '按主题归类', '📝', 2),
  ('story', '故事', 'Story', '按叙事结构+常用元素归类', '📖', 3),
  ('toolbox', '素材库', 'Toolbox', '万能词汇提升语言质量', '📚', 4)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Sections
WITH cats AS (SELECT slug, id FROM kb_categories)
INSERT INTO kb_sections (category_slug, slug, label_zh, label_en, description, sort_order)
SELECT cats.slug, v.slug, v.label_zh, v.label_en, v.description, v.sort_order
FROM cats
CROSS JOIN LATERAL (VALUES
  ('email_beginning', '开头', 'Beginning', '邮件开头的常用表达', 1),
  ('email_body', '主体', 'Body', '邮件主体的内容表达', 2),
  ('email_ending', '结尾', 'Ending', '邮件结尾的礼貌用语', 3)
) AS v(slug, label_zh, label_en, description, sort_order)
WHERE cats.slug = 'email'
ON CONFLICT (category_slug, slug) DO NOTHING;

WITH cats AS (SELECT slug, id FROM kb_categories)
INSERT INTO kb_sections (category_slug, slug, label_zh, label_en, description, sort_order)
SELECT cats.slug, v.slug, v.label_zh, v.label_en, v.description, v.sort_order
FROM cats
CROSS JOIN LATERAL (VALUES
  ('article_favorite_place', '地点描述', 'Favorite place', '描述最喜欢的地方', 1),
  ('article_difficult_thing', '困难事物', 'Difficult thing', '描述遇到的困难', 2),
  ('article_friendship', '人际友谊', 'How to make friends', '关于友谊的观点和方法', 3),
  ('article_living_environment', '居住环境', 'Living environment', '描述居住环境的改善', 4),
  ('article_admired_person', '敬佩的人', 'A person you admire', '描述敬佩的人物', 5),
  ('article_hobby', '兴趣爱好', 'Painting/Music', '描述兴趣爱好', 6),
  ('article_reading', '读书', 'Reading', '关于读书的话题', 7)
) AS v(slug, label_zh, label_en, description, sort_order)
WHERE cats.slug = 'article'
ON CONFLICT (category_slug, slug) DO NOTHING;

WITH cats AS (SELECT slug, id FROM kb_categories)
INSERT INTO kb_sections (category_slug, slug, label_zh, label_en, description, sort_order)
SELECT cats.slug, v.slug, v.label_zh, v.label_en, v.description, v.sort_order
FROM cats
CROSS JOIN LATERAL (VALUES
  ('story_opening', '开头承接', 'Opening', '承接首句设置背景引入人物状态', 1),
  ('story_development', '发展推进', 'Development', '描述一系列动作使用连接词使故事流畅', 2),
  ('story_climax', '高潮转折', 'Climax', '故事发生意外转折情绪达到顶点', 3),
  ('story_ending', '结尾收束', 'Ending', '总结结局点明意义或留下回味', 4)
) AS v(slug, label_zh, label_en, description, sort_order)
WHERE cats.slug = 'story'
ON CONFLICT (category_slug, slug) DO NOTHING;

WITH cats AS (SELECT slug, id FROM kb_categories)
INSERT INTO kb_sections (category_slug, slug, label_zh, label_en, description, sort_order)
SELECT cats.slug, v.slug, v.label_zh, v.label_en, v.description, v.sort_order
FROM cats
CROSS JOIN LATERAL (VALUES
  ('toolbox_connectors', '亮点时间/逻辑连接词', 'Connectors', '使文章逻辑更清晰的连接词', 1),
  ('toolbox_action_adverbs', '高级动作副词', 'Action Adverbs', '描述动作的副词', 2),
  ('toolbox_emotion_adjectives', '情绪形容词', 'Emotion Adjectives', '描述情绪的形容词', 3),
  ('toolbox_verb_phrases', '万能动词短语', 'Verb Phrases', '常用的动词短语', 4),
  ('toolbox_sentence_structures', '高分句型结构', 'Sentence Structures', '提升分数的句型结构', 5)
) AS v(slug, label_zh, label_en, description, sort_order)
WHERE cats.slug = 'toolbox'
ON CONFLICT (category_slug, slug) DO NOTHING;

-- Step 3: Materials
WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('Thank you for...', 'phrase', '感谢...', '回应感谢', 'Thank you for letting us know about the film evening this Friday!', '2025.2.9广州', 1),
  ('I''m really excited', 'phrase', '我很兴奋', '表达激动', 'I''m over the moon that we''re having a fun camping trip together next Friday!', '2026.1.10广州', 2),
  ('thrilled', 'vocabulary', '高兴极了', '表达激动', 'I''m over the moon that we''re having a fun camping trip together next Friday!', '2026.1.10广州', 3),
  ('over the moon', 'phrase', '高兴极了', '表达激动', 'I''m over the moon that we''re having a fun camping trip together next Friday!', '2026.1.10广州', 4),
  ('can''t wait to...', 'phrase', '等不及...', '表达激动', 'Can''t wait for Saturday!', '2025.7.19北京', 5),
  ('I''d love to...', 'phrase', '我很乐意...', '接受邀请', 'I''d love to make a rocket model with you!', '2025.7.19北京', 6)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'email_beginning'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('I prefer to...', 'phrase', '我更喜欢...', '表达喜好', 'I prefer to watch comedies because they always make me laugh.', '2025.2.9广州', 1),
  ('would be more interesting', 'phrase', '会更有趣', '表达喜好', 'I think the history of computers would be more interesting because there are many cool stories.', '2025.8.16北京', 2),
  ('is a great idea', 'phrase', '是个好主意', '表达喜好', 'I think the history of computers would be more interesting because there are many cool stories.', '2025.8.16北京', 3),
  ('How about...?', 'phrase', '...怎么样？', '提出建议', 'How about having the party in the school hall?', '2025.6.14北京', 4),
  ('We could...', 'phrase', '我们可以...', '提出建议', 'How about having the party in the school hall?', '2025.6.14北京', 5),
  ('I suggest packing...', 'phrase', '我建议带上...', '提出建议', 'I suggest packing your favorite books so we can browse them.', '2025.11.9南京', 6),
  ('because...', 'phrase', '因为...', '解释原因', 'I prefer quiet and gentle songs because they make me feel relaxed.', '通用素材', 7),
  ('so that...', 'phrase', '以便...', '解释原因', 'We need a peaceful atmosphere so games would be too loud to disturb them.', '2025.11.9南京', 8),
  ('which...', 'phrase', '这（定语从句）', '解释原因', 'I prefer quiet and gentle songs because they make me feel relaxed.', '通用素材', 9),
  ('Unfortunately I''m not available...', 'sentence', '不幸的是我没空...', '礼貌拒绝+理由', 'Unfortunately I''m not available this Wednesday since I have already planned a family trip.', '2025.8.16北京', 10),
  ('I''m sorry to say that I won''t be able to...', 'sentence', '很抱歉我不能...', '礼貌拒绝+理由', 'I''m sorry to say that I won''t be able to help clean the classroom because I have an online math class.', '2025.2.9广州', 11)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'email_body'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('I''m looking forward to...', 'phrase', '我期待着...', '表达期待', 'I''m looking forward to a great evening with everyone.', '2025.2.9广州', 1),
  ('Can''t wait for...', 'phrase', '等不及...', '表达期待', 'Can''t wait for Saturday!', '2025.7.19北京', 2),
  ('Let me know if I should bring anything.', 'sentence', '如果需要我带什么请告诉我。', '主动提供帮助', 'Let me know if I should bring anything.', '2025.7.19北京', 3),
  ('Just tell me what you need!', 'sentence', '告诉我你需要什么！', '主动提供帮助', 'Just tell me what you need!', '2025.5.17北京', 4),
  ('Best wishes', 'phrase', '最好的祝愿', '祝福落款', 'Best wishes. / Best regards.', '通用', 5),
  ('Best regards', 'phrase', '最好的祝愿', '祝福落款', 'Best wishes. / Best regards.', '通用', 6)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'email_ending'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('peaceful', 'vocabulary', '宁静的', '环境', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 1),
  ('beautiful', 'vocabulary', '美丽的', '环境', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 2),
  ('vibrant', 'vocabulary', '生机勃勃的', '环境', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 3),
  ('graceful', 'vocabulary', '优雅的', '环境', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 4),
  ('take leisurely walks', 'phrase', '悠闲地散步', '活动', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 5),
  ('ride my bike', 'phrase', '骑自行车', '活动', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 6),
  ('have picnics', 'phrase', '野餐', '活动', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', '2025.1.11北京', 7),
  ('unwind', 'vocabulary', '放松', '感受', 'The beautiful view of the sky offers a perfect way to end the day.', '2025.1.11北京', 8),
  ('ideal', 'vocabulary', '理想的', '感受', 'The beautiful view of the sky offers a perfect way to end the day.', '2025.1.11北京', 9),
  ('a perfect way to end the day', 'phrase', '结束一天的完美方式', '感受', 'The beautiful view of the sky offers a perfect way to end the day.', '2025.1.11北京', 10)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_favorite_place'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('challenging', 'vocabulary', '有挑战性的', '困难描述', 'My heart races and I worry about forgetting my words or making mistakes.', '2025.2.15上海', 1),
  ('nervous', 'vocabulary', '紧张的', '困难描述', 'My heart races and I worry about forgetting my words or making mistakes.', '2025.2.15上海', 2),
  ('heart races', 'phrase', '心跳加速', '困难描述', 'My heart races and I worry about forgetting my words or making mistakes.', '2025.2.15上海', 3),
  ('make mistakes', 'phrase', '犯错', '困难描述', 'My heart races and I worry about forgetting my words or making mistakes.', '2025.2.15上海', 4),
  ('boost confidence', 'phrase', '提升自信', '原因/重要性', 'Good communication can boost confidence and help people share their thoughts.', '2025.2.15上海', 5),
  ('good communication', 'phrase', '良好的沟通', '原因/重要性', 'Good communication can boost confidence and help people share their thoughts.', '2025.2.15上海', 6),
  ('express ideas', 'phrase', '表达想法', '原因/重要性', 'Good communication can boost confidence and help people share their thoughts.', '2025.2.15上海', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_difficult_thing'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('look after each other', 'phrase', '互相照顾', '观点', 'True friendship means supporting each other in both good and bad times.', '2025.4.12济南', 1),
  ('in good and bad times', 'phrase', '无论好坏', '观点', 'True friendship means supporting each other in both good and bad times.', '2025.4.12济南', 2),
  ('join clubs', 'phrase', '加入俱乐部', '方法', 'Last but not least be kind and helpful.', '2025.4.12济南', 3),
  ('be a good listener', 'phrase', '做一个好的倾听者', '方法', 'Last but not least be kind and helpful.', '2025.4.12济南', 4),
  ('offer to help', 'phrase', '主动帮忙', '方法', 'Last but not least be kind and helpful.', '2025.4.12济南', 5),
  ('give a compliment', 'phrase', '给予赞美', '方法', 'Last but not least be kind and helpful.', '2025.4.12济南', 6),
  ('True friendship is rare treasure it', 'sentence', '真正的友谊很珍贵要珍惜', '升华', 'True friendship is rare so treasure it when you find it!', '2025.4.12济南', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_friendship'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('noisy', 'vocabulary', '吵闹的', '问题', 'This disorganized parking makes it difficult for pedestrians to walk safely.', '2025.4.26北京', 1),
  ('disorganized', 'vocabulary', '无序的', '问题', 'This disorganized parking makes it difficult for pedestrians to walk safely.', '2025.4.26北京', 2),
  ('parked in wrong places', 'phrase', '停错地方', '问题', 'This disorganized parking makes it difficult for pedestrians to walk safely.', '2025.4.26北京', 3),
  ('create designated parking spaces', 'phrase', '创建指定停车位', '建议', 'Green areas are essential for our health and well-being.', '2025.4.26北京', 4),
  ('more green spaces', 'phrase', '更多绿地', '建议', 'Green areas are essential for our health and well-being.', '2025.4.26北京', 5),
  ('essential for well-being', 'phrase', '对健康至关重要', '重要性', 'Green areas are essential for our health and well-being.', '2025.4.26北京', 6),
  ('provide fresh air', 'phrase', '提供新鲜空气', '重要性', 'Green areas are essential for our health and well-being.', '2025.4.26北京', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_living_environment'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('incredibly kind', 'phrase', '非常善良', '品质', 'His motto seems to be: "If I have it and you need it let''s share!"', '2025.7.19北京', 1),
  ('thinking of others', 'phrase', '为他人着想', '品质', 'His motto seems to be: "If I have it and you need it let''s share!"', '2025.7.19北京', 2),
  ('never expects thanks', 'phrase', '从不期待感谢', '品质', 'His motto seems to be: "If I have it and you need it let''s share!"', '2025.7.19北京', 3),
  ('shares generously', 'phrase', '慷慨分享', '品质', 'His motto seems to be: "If I have it and you need it let''s share!"', '2025.7.19北京', 4),
  ('taught me that happiness comes from helping', 'sentence', '教会我幸福来自助人', '影响', 'I truly admire his big heart and I want to be more like him.', '2025.7.19北京', 5),
  ('brightened the community', 'phrase', '点亮了社区', '影响', 'I truly admire his big heart and I want to be more like him.', '2025.7.19北京', 6)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_admired_person'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('express thoughts and feelings', 'phrase', '表达思想和感受', '好处', 'Painting is a great way to express my thoughts and feelings.', '2025.2.23南京', 1),
  ('escape from stress', 'phrase', '逃离压力', '好处', 'Painting is a great way to express my thoughts and feelings.', '2025.2.23南京', 2),
  ('a rewarding activity', 'phrase', '有意义的活动', '好处', 'It is a wonderful idea to give a handmade painting as a gift.', '2025.2.23南京', 3),
  ('gentle', 'vocabulary', '轻柔的', '描述音乐', 'Soft piano music never distracts me while I study.', '2025.8.16北京', 4),
  ('quiet', 'vocabulary', '安静的', '描述音乐', 'Soft piano music never distracts me while I study.', '2025.8.16北京', 5),
  ('focus better', 'phrase', '更好地集中注意力', '描述音乐', 'Soft piano music never distracts me while I study.', '2025.8.16北京', 6),
  ('distract me', 'phrase', '让我分心', '描述音乐', 'Soft piano music never distracts me while I study.', '2025.8.16北京', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_hobby'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('detective and comedy books', 'phrase', '侦探和喜剧书籍', '类型', 'The plot is interesting because it''s unexpected.', '2025.3.8北京', 1),
  ('unexpected', 'vocabulary', '出人意料的', '情节描述', 'The plot is interesting because it''s unexpected.', '2025.3.8北京', 2),
  ('sneaking', 'vocabulary', '偷偷摸摸的', '情节描述', 'The thieves were tricked by a child.', '2025.3.8北京', 3),
  ('didn''t panic', 'phrase', '没有惊慌', '情节描述', 'The thieves were tricked by a child.', '2025.3.8北京', 4),
  ('tricked', 'vocabulary', '被欺骗', '情节描述', 'The thieves were tricked by a child.', '2025.3.8北京', 5),
  ('funny and clever', 'phrase', '有趣又聪明', '感受', 'The plot is interesting because it''s unexpected.', '2025.3.8北京', 6),
  ('makes me laugh', 'phrase', '让我笑', '感受', 'The plot is interesting because it''s unexpected.', '2025.3.8北京', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'article_reading'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('It was... when...', 'phrase', 'It was... when...', '句型', 'I was waiting for the bus when I saw a tiger running towards me.', 'Page 9', 1),
  ('I was... when suddenly...', 'phrase', 'I was... when suddenly...', '句型', 'He was reading a book when an apple fell on his head.', 'Page 11范文分析-2', 2),
  ('过去进行时 (was/were doing)', 'phrase', '过去进行时', '时态', 'I was waiting for the bus when I saw a tiger running towards me.', 'Page 9', 3),
  ('filled with', 'phrase', '充满', '环境描写', 'The park is filled with tall trees vibrant flowers and a small pond where ducks gracefully swim.', 'Page 9', 4)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'story_opening'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('first', 'vocabulary', '首先', '时间词', 'A few days later he went back to that cave with his friends.', 'Page 9', 1),
  ('then', 'vocabulary', '然后', '时间词', 'A few days later he went back to that cave with his friends.', 'Page 9', 2),
  ('later', 'vocabulary', '之后', '时间词', 'A few days later he went back to that cave with his friends.', 'Page 9', 3),
  ('a few days later', 'phrase', '几天后', '时间词', 'A few days later he went back to that cave with his friends.', 'Page 9', 4),
  ('finally', 'vocabulary', '最后', '时间词', 'A few days later he went back to that cave with his friends.', 'Page 9', 5),
  ('in the end', 'phrase', '最终', '时间词', 'A few days later he went back to that cave with his friends.', 'Page 9', 6),
  ('Instantly', 'vocabulary', '立刻', '动作副词', 'Instantly she picked up the letter and started to read it.', 'Page 10范文分析-1', 7),
  ('Quickly', 'vocabulary', '快速地', '动作副词', 'Instantly she picked up the letter and started to read it.', 'Page 10范文分析-1', 8),
  ('Slowly', 'vocabulary', '缓慢地', '动作副词', 'Instantly she picked up the letter and started to read it.', 'Page 10范文分析-1', 9),
  ('Carefully', 'vocabulary', '小心地', '动作副词', 'Instantly she picked up the letter and started to read it.', 'Page 10范文分析-1', 10)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'story_development'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('but', 'vocabulary', '但是', '转折词', 'Suddenly I heard a weak cry. A boy was lying under the deck!', 'Page 12范文2', 1),
  ('however', 'vocabulary', '然而', '转折词', 'Suddenly I heard a weak cry. A boy was lying under the deck!', 'Page 12范文2', 2),
  ('suddenly', 'vocabulary', '突然', '转折词', 'Suddenly I heard a weak cry. A boy was lying under the deck!', 'Page 12范文2', 3),
  ('to one''s surprise', 'phrase', '令某人惊讶的是', '转折词', 'To their surprise it was a cute little rabbit!', 'Page 15范文1', 4),
  ('panicked', 'vocabulary', '恐慌的', '情绪词', 'Suddenly I heard a weak cry. A boy was lying under the deck!', 'Page 12范文2', 5),
  ('astonished', 'vocabulary', '震惊的', '情绪词', 'To their surprise it was a cute little rabbit!', 'Page 15范文1', 6),
  ('amazed', 'vocabulary', '惊奇的', '情绪词', 'To their surprise it was a cute little rabbit!', 'Page 15范文1', 7),
  ('exhausted', 'vocabulary', '筋疲力尽的', '情绪词', 'Suddenly I heard a weak cry. A boy was lying under the deck!', 'Page 12范文2', 8),
  ('unfortunately', 'vocabulary', '不幸的是', '评论副词', 'Suddenly I heard a weak cry. A boy was lying under the deck!', 'Page 12范文2', 9),
  ('luckily', 'vocabulary', '幸运的是', '评论副词', 'To their surprise it was a cute little rabbit!', 'Page 15范文1', 10),
  ('fortunately', 'vocabulary', '幸运的是', '评论副词', 'To their surprise it was a cute little rabbit!', 'Page 15范文1', 11)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'story_climax'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('That day we became friends...', 'sentence', '那天我们成了朋友...', '结尾句', 'That day at the beach became a wonderful memory for Jesse and her friend.', 'Page 13范文1', 1),
  ('It was an incredible encounter...', 'sentence', '这是一次不可思议的经历...', '结尾句', 'This adventure had added a splash of color to their ordinary lives.', 'Page 13范文2', 2),
  ('...became a wonderful memory...', 'phrase', '...成为美好的回忆...', '升华', 'That day at the beach became a wonderful memory for Jesse and her friend.', 'Page 13范文1', 3),
  ('...added a splash of color to their ordinary lives.', 'sentence', '...为他们的平凡生活增添了一抹色彩。', '升华', 'This adventure had added a splash of color to their ordinary lives.', 'Page 13范文2', 4)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'story_ending'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('First', 'vocabulary', '首先', null, 'First we need to plan carefully.', '通用', 1),
  ('Then', 'vocabulary', '然后', null, 'Then we should prepare materials.', '通用', 2),
  ('Later', 'vocabulary', '之后', null, 'Later we can discuss the results.', '通用', 3),
  ('A few days later', 'phrase', '几天后', null, 'A few days later he went back to that cave with his friends.', 'Page 9', 4),
  ('Finally', 'vocabulary', '最后', null, 'Finally we finished the project.', '通用', 5),
  ('In the end', 'phrase', '最终', null, 'In the end everything worked out.', '通用', 6),
  ('However', 'vocabulary', '然而', null, 'However we need to consider the budget.', '通用', 7),
  ('Suddenly', 'vocabulary', '突然', null, 'Suddenly I heard a weak cry.', 'Page 12范文2', 8),
  ('Unfortunately', 'vocabulary', '不幸的是', null, 'Unfortunately I''m not available this Wednesday.', '2025.8.16北京', 9),
  ('Luckily', 'vocabulary', '幸运的是', null, 'Luckily we found the way out.', '通用', 10),
  ('As soon as', 'phrase', '一...就...', null, 'As soon as I opened the door I saw a surprise.', '通用', 11)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'toolbox_connectors'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('Instantly', 'vocabulary', '立刻', null, 'Instantly she picked up the letter.', 'Page 10范文分析-1', 1),
  ('Quickly', 'vocabulary', '快速地', null, 'Quickly he ran to the door.', '通用', 2),
  ('Slowly', 'vocabulary', '缓慢地', null, 'Slowly she opened the box.', '通用', 3),
  ('Carefully', 'vocabulary', '小心地', null, 'Carefully he placed the vase on the table.', '通用', 4),
  ('Angrily', 'vocabulary', '生气地', null, 'Angrily he slammed the door.', '通用', 5),
  ('Gracefully', 'vocabulary', '优雅地', null, 'Gracefully she danced across the stage.', '通用', 6),
  ('Leisurely', 'vocabulary', '悠闲地', null, 'Leisurely we walked through the garden.', '通用', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'toolbox_action_adverbs'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('Excited', 'vocabulary', '兴奋的', null, 'I am excited about the trip.', '通用', 1),
  ('Amazed', 'vocabulary', '惊奇的', null, 'I was amazed by the beautiful sunset.', '通用', 2),
  ('Panicked', 'vocabulary', '恐慌的', null, 'Suddenly I panicked when I saw the fire.', '通用', 3),
  ('Relieved', 'vocabulary', '松了一口气的', null, 'I felt relieved when I found my keys.', '通用', 4),
  ('Astonished', 'vocabulary', '震惊的', null, 'I was astonished by the news.', '通用', 5),
  ('Exhausted', 'vocabulary', '筋疲力尽的', null, 'After the long run I felt exhausted.', '通用', 6),
  ('Delighted', 'vocabulary', '高兴的', null, 'I was delighted to receive the gift.', '通用', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'toolbox_emotion_adjectives'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('take a leisurely walk', 'phrase', '悠闲地散步', null, 'We decided to take a leisurely walk in the park.', '通用', 1),
  ('have a picnic', 'phrase', '野餐', null, 'We had a picnic by the lake last Sunday.', '通用', 2),
  ('boost confidence', 'phrase', '提升自信', null, 'Good communication can boost confidence.', '2025.2.15上海', 3),
  ('offer to help', 'phrase', '主动帮忙', null, 'Last but not least be kind and offer to help.', '2025.4.12济南', 4),
  ('give a compliment', 'phrase', '给予赞美', null, 'It''s nice to give a compliment to others.', '通用', 5),
  ('escape from stress', 'phrase', '逃离压力', null, 'Reading helps me escape from stress.', '通用', 6),
  ('unwind', 'vocabulary', '放松', null, 'After school I like to unwind by listening to music.', '通用', 7)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'toolbox_verb_phrases'
ON CONFLICT DO NOTHING;

WITH secs AS (SELECT slug, id FROM kb_sections)
INSERT INTO kb_materials (section_id, text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
SELECT secs.id, v.text, v.type, v.meaning_zh, v.sub_category, v.example_sentence, v.example_source, v.sort_order
FROM secs
CROSS JOIN LATERAL (VALUES
  ('定语从句', 'phrase', '...which / that / who...', null, 'The book which I borrowed is very interesting.', '通用', 1),
  ('It allows me to...', 'phrase', '这让我能够...', null, 'Painting allows me to express my thoughts.', '2025.2.23南京', 2),
  ('It is a wonderful idea to...', 'phrase', '...是个好主意', null, 'It is a wonderful idea to give a handmade painting as a gift.', '2025.2.23南京', 3),
  ('I believe that...', 'phrase', '我相信...', null, 'I believe that true friendship is rare.', '2025.4.12济南', 4),
  ('The reason why...is that...', 'phrase', '...的原因是...', null, 'The reason why I like reading is that it opens my mind.', '通用', 5)
) AS v(text, type, meaning_zh, sub_category, example_sentence, example_source, sort_order)
WHERE secs.slug = 'toolbox_sentence_structures'
ON CONFLICT DO NOTHING;
