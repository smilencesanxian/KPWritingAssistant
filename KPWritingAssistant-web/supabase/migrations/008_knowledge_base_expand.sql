-- ============================================================
-- KP作文宝 v1.2.1 - Migration 008: Knowledge Base Expansion
-- Extends recommended_phrases with category/level fields,
-- adds knowledge_essay_type to highlights_library,
-- supports story type, and inserts seed data
-- ============================================================

-- ------------------------------------------------------------
-- Step 1: Add category and level fields to recommended_phrases
-- ------------------------------------------------------------
ALTER TABLE recommended_phrases
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('basic', 'advanced'));

-- ------------------------------------------------------------
-- Step 2: Update essay_type constraint to support 'story'
-- ------------------------------------------------------------
-- First check if constraint exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'recommended_phrases_essay_type_check'
    AND table_name = 'recommended_phrases'
  ) THEN
    ALTER TABLE recommended_phrases
    DROP CONSTRAINT recommended_phrases_essay_type_check;
  END IF;
END $$;

-- Add new constraint with story support
ALTER TABLE recommended_phrases
ADD CONSTRAINT recommended_phrases_essay_type_check
CHECK (essay_type IN ('email', 'article', 'story', 'general'));

-- ------------------------------------------------------------
-- Step 3: Add knowledge_essay_type to highlights_library
-- ------------------------------------------------------------
ALTER TABLE highlights_library
ADD COLUMN IF NOT EXISTS knowledge_essay_type TEXT CHECK (knowledge_essay_type IN ('email', 'article', 'story', 'general'));

-- Add index for knowledge_essay_type queries
CREATE INDEX IF NOT EXISTS idx_highlights_knowledge_essay_type ON highlights_library (knowledge_essay_type);

-- Add index for recommended_phrases category queries
CREATE INDEX IF NOT EXISTS idx_recommended_phrases_category ON recommended_phrases (category);
CREATE INDEX IF NOT EXISTS idx_recommended_phrases_level ON recommended_phrases (level);

-- ------------------------------------------------------------
-- Step 4: Insert seed data for Email (essay_type='email')
-- Categories: opening, opinion, connector, detail, closing
-- ------------------------------------------------------------

-- Email - Opening (Basic & Advanced)
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('Thanks for your email!', 'sentence', 'email', 'opening', 'basic', 'Thanks for your email! I hope you are doing well.', 1),
('How are you?', 'sentence', 'email', 'opening', 'basic', 'How are you? I hope everything is going well.', 2),
('It was great to receive your email!', 'sentence', 'email', 'opening', 'advanced', 'It was great to receive your email! I was so happy to hear from you.', 3),
('I was delighted to hear from you.', 'sentence', 'email', 'opening', 'advanced', 'I was delighted to hear from you. It has been too long!', 4),
('I hope this email finds you well.', 'sentence', 'email', 'opening', 'advanced', 'I hope this email finds you well. I am writing to...', 5)
ON CONFLICT DO NOTHING;

-- Email - Opinion (Basic & Advanced)
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('I think...', 'phrase', 'email', 'opinion', 'basic', 'I think we should meet next week.', 10),
('I believe...', 'phrase', 'email', 'opinion', 'basic', 'I believe this is a good idea.', 11),
('I strongly believe that...', 'phrase', 'email', 'opinion', 'advanced', 'I strongly believe that we need to take action.', 12),
('In my opinion...', 'phrase', 'email', 'opinion', 'advanced', 'In my opinion, this is the best solution.', 13),
('From my point of view...', 'phrase', 'email', 'opinion', 'advanced', 'From my point of view, we should start immediately.', 14)
ON CONFLICT DO NOTHING;

-- Email - Connector (Basic & Advanced)
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('First,...', 'phrase', 'email', 'connector', 'basic', 'First, we need to plan carefully.', 20),
('Second,...', 'phrase', 'email', 'connector', 'basic', 'Second, we should prepare materials.', 21),
('Also,...', 'phrase', 'email', 'connector', 'basic', 'Also, I wanted to tell you something.', 22),
('Moreover,...', 'phrase', 'email', 'connector', 'advanced', 'Moreover, this approach saves time.', 23),
('Furthermore,...', 'phrase', 'email', 'connector', 'advanced', 'Furthermore, it is cost-effective.', 24),
('In addition,...', 'phrase', 'email', 'connector', 'advanced', 'In addition, everyone can participate.', 25),
('However,...', 'phrase', 'email', 'connector', 'advanced', 'However, we need to consider the budget.', 26),
('Therefore,...', 'phrase', 'email', 'connector', 'advanced', 'Therefore, I suggest we start soon.', 27)
ON CONFLICT DO NOTHING;

-- Email - Detail (Basic & Advanced)
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('It is good.', 'phrase', 'email', 'detail', 'basic', 'It is good to see you.', 30),
('It is nice.', 'phrase', 'email', 'detail', 'basic', 'The weather is nice today.', 31),
('It is absolutely fantastic!', 'phrase', 'email', 'detail', 'advanced', 'It is absolutely fantastic to hear this news!', 32),
('It is incredibly interesting.', 'phrase', 'email', 'detail', 'advanced', 'It is incredibly interesting to learn about this.', 33),
('I am really looking forward to...', 'phrase', 'email', 'detail', 'advanced', 'I am really looking forward to seeing you.', 34)
ON CONFLICT DO NOTHING;

-- Email - Closing (Basic & Advanced)
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('See you soon!', 'sentence', 'email', 'closing', 'basic', 'See you soon! Take care.', 40),
('Write back soon!', 'sentence', 'email', 'closing', 'basic', 'Write back soon! I am waiting for your reply.', 41),
('I cannot wait to...', 'phrase', 'email', 'closing', 'advanced', 'I cannot wait to hear from you.', 42),
('I am looking forward to hearing from you.', 'sentence', 'email', 'closing', 'advanced', 'I am looking forward to hearing from you soon.', 43),
('Please let me know if you need anything.', 'sentence', 'email', 'closing', 'advanced', 'Please let me know if you need anything else.', 44)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Step 5: Insert seed data for Article (essay_type='article')
-- Categories: title, opening, closing
-- ------------------------------------------------------------

-- Article - Title
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('My Favorite Hobby: Reading', 'phrase', 'article', 'title', 'advanced', 'My Favorite Hobby: Reading', 50),
('The Best Way to Stay Healthy', 'phrase', 'article', 'title', 'advanced', 'The Best Way to Stay Healthy', 51),
('Why I Love Playing Sports', 'phrase', 'article', 'title', 'advanced', 'Why I Love Playing Sports', 52),
('An Unforgettable Experience', 'phrase', 'article', 'title', 'advanced', 'An Unforgettable Experience', 53)
ON CONFLICT DO NOTHING;

-- Article - Opening
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('I like reading.', 'sentence', 'article', 'opening', 'basic', 'I like reading very much.', 60),
('Reading has always been my passion.', 'sentence', 'article', 'opening', 'advanced', 'Reading has always been my passion since I was young.', 61),
('There are many reasons why I enjoy...', 'sentence', 'article', 'opening', 'advanced', 'There are many reasons why I enjoy this hobby.', 62),
('When it comes to..., I always think of...', 'sentence', 'article', 'opening', 'advanced', 'When it comes to hobbies, I always think of reading.', 63)
ON CONFLICT DO NOTHING;

-- Article - Closing
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('I like it very much.', 'sentence', 'article', 'closing', 'basic', 'I like it very much.', 70),
('This hobby has truly enriched my life.', 'sentence', 'article', 'closing', 'advanced', 'This hobby has truly enriched my life in many ways.', 71),
('I hope more people can discover the joy of...', 'sentence', 'article', 'closing', 'advanced', 'I hope more people can discover the joy of reading.', 72),
('In conclusion,...is an amazing experience.', 'sentence', 'article', 'closing', 'advanced', 'In conclusion, reading is an amazing experience.', 73)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Step 6: Insert seed data for Story (essay_type='story')
-- Categories: opening, plot, emotion
-- ------------------------------------------------------------

-- Story - Opening (must use the given sentence, so these are examples)
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('Lily found an old box under her bed.', 'sentence', 'story', 'opening', 'advanced', 'Lily found an old box under her bed.', 80),
('It was a rainy afternoon when...', 'sentence', 'story', 'opening', 'advanced', 'It was a rainy afternoon when the phone rang.', 81),
('As soon as I opened the door, I saw...', 'sentence', 'story', 'opening', 'advanced', 'As soon as I opened the door, I saw a surprise.', 82)
ON CONFLICT DO NOTHING;

-- Story - Plot
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('She opened it.', 'sentence', 'story', 'plot', 'basic', 'She opened it carefully.', 90),
('To her surprise, she discovered...', 'sentence', 'story', 'plot', 'advanced', 'To her surprise, she discovered a letter inside.', 91),
('Suddenly,...', 'phrase', 'story', 'plot', 'advanced', 'Suddenly, everything changed.', 92),
('Without hesitation,...', 'phrase', 'story', 'plot', 'advanced', 'Without hesitation, she made a decision.', 93),
('At that moment,...', 'phrase', 'story', 'plot', 'advanced', 'At that moment, she realized the truth.', 94)
ON CONFLICT DO NOTHING;

-- Story - Emotion
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('She was happy.', 'sentence', 'story', 'emotion', 'basic', 'She was happy to see her friend.', 100),
('Her heart was pounding with excitement.', 'sentence', 'story', 'emotion', 'advanced', 'Her heart was pounding with excitement.', 101),
('Tears of joy filled her eyes.', 'sentence', 'story', 'emotion', 'advanced', 'Tears of joy filled her eyes.', 102),
('A wave of relief washed over her.', 'sentence', 'story', 'emotion', 'advanced', 'A wave of relief washed over her.', 103)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Step 7: Insert seed data for General (essay_type='general')
-- Categories: emotion_vocab, action_vocab, adverb, complex_sentence
-- ------------------------------------------------------------

-- General - Emotion Vocabulary
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('happy', 'vocabulary', 'general', 'emotion_vocab', 'basic', 'I feel happy today.', 110),
('sad', 'vocabulary', 'general', 'emotion_vocab', 'basic', 'The movie made me sad.', 111),
('excited', 'vocabulary', 'general', 'emotion_vocab', 'basic', 'I am excited about the trip.', 112),
('delighted', 'vocabulary', 'general', 'emotion_vocab', 'advanced', 'I was delighted to receive the gift.', 113),
('thrilled', 'vocabulary', 'general', 'emotion_vocab', 'advanced', 'She was thrilled with the results.', 114),
('overjoyed', 'vocabulary', 'general', 'emotion_vocab', 'advanced', 'They were overjoyed at the news.', 115)
ON CONFLICT DO NOTHING;

-- General - Action Vocabulary
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('go', 'vocabulary', 'general', 'action_vocab', 'basic', 'I want to go home.', 120),
('do', 'vocabulary', 'general', 'action_vocab', 'basic', 'What should I do?', 121),
('explore', 'vocabulary', 'general', 'action_vocab', 'advanced', 'We decided to explore the old town.', 122),
('discover', 'vocabulary', 'general', 'action_vocab', 'advanced', 'She discovered a hidden path.', 123),
('accomplish', 'vocabulary', 'general', 'action_vocab', 'advanced', 'He accomplished his goal.', 124)
ON CONFLICT DO NOTHING;

-- General - Adverb
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('very', 'vocabulary', 'general', 'adverb', 'basic', 'It is very good.', 130),
('quite', 'vocabulary', 'general', 'adverb', 'basic', 'It is quite interesting.', 131),
('extremely', 'vocabulary', 'general', 'adverb', 'advanced', 'It is extremely important.', 132),
('absolutely', 'vocabulary', 'general', 'adverb', 'advanced', 'I absolutely agree with you.', 133),
('completely', 'vocabulary', 'general', 'adverb', 'advanced', 'I completely understand.', 134)
ON CONFLICT DO NOTHING;

-- General - Complex Sentence
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, sort_order) VALUES
('Although it was raining, we went out.', 'sentence', 'general', 'complex_sentence', 'advanced', 'Although it was raining, we went out for a walk.', 140),
('If I had more time, I would...', 'sentence', 'general', 'complex_sentence', 'advanced', 'If I had more time, I would travel more.', 141),
('Because of this,...', 'phrase', 'general', 'complex_sentence', 'advanced', 'Because of this, we changed our plan.', 142),
('It is...that...', 'phrase', 'general', 'complex_sentence', 'advanced', 'It is important that we finish on time.', 143),
('Not only...but also...', 'phrase', 'general', 'complex_sentence', 'advanced', 'Not only is it fun, but also educational.', 144)
ON CONFLICT DO NOTHING;
