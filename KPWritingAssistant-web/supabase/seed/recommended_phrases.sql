-- ============================================================
-- KP作文宝 v1.2.0 - Seed Data: Recommended Phrases
-- Initial recommended phrases for PET writing practice
-- ============================================================

-- Part 1 Email Writing Phrases
INSERT INTO recommended_phrases (text, type, essay_type, topic_tags, usage_example, is_active, sort_order) VALUES
('I''m writing to ask about...', 'sentence', 'email', ARRAY['opening', 'inquiry'], 'I''m writing to ask about the camping trip you mentioned last week.', true, 1),
('I would be grateful if you could...', 'sentence', 'email', ARRAY['polite', 'request'], 'I would be grateful if you could send me more information about the event.', true, 2),
('I''m sorry to hear that...', 'sentence', 'email', ARRAY['empathy', 'response'], 'I''m sorry to hear that you''ve been having some problems.', true, 3),
('Looking forward to hearing from you.', 'sentence', 'email', ARRAY['closing'], 'Please let me know your decision. Looking forward to hearing from you.', true, 4),
('Thank you for your email.', 'sentence', 'email', ARRAY['opening', 'gratitude'], 'Thank you for your email. It was great to hear from you.', true, 5),
('Please let me know if...', 'sentence', 'email', ARRAY['closing', 'request'], 'Please let me know if you need any more information.', true, 6),
('I hope you''re doing well.', 'sentence', 'email', ARRAY['opening'], 'I hope you''re doing well. I haven''t seen you for a long time!', true, 7),
('I was wondering if...', 'sentence', 'email', ARRAY['polite', 'inquiry'], 'I was wondering if you could help me with something.', true, 8);

-- Part 2 Article/Essay Writing Phrases
INSERT INTO recommended_phrases (text, type, essay_type, topic_tags, usage_example, is_active, sort_order) VALUES
('In my opinion,...', 'sentence', 'article', ARRAY['opinion', 'viewpoint'], 'In my opinion, this is the best solution to the problem.', true, 10),
('There are several reasons why...', 'sentence', 'article', ARRAY['argument', 'explanation'], 'There are several reasons why I believe this is important.', true, 11),
('It is important to...', 'sentence', 'article', ARRAY['emphasis', 'suggestion'], 'It is important to consider all the options before making a decision.', true, 12),
('As far as I''m concerned,...', 'sentence', 'article', ARRAY['opinion', 'viewpoint'], 'As far as I''m concerned, the benefits outweigh the drawbacks.', true, 13),
('From my point of view,...', 'sentence', 'article', ARRAY['opinion', 'viewpoint'], 'From my point of view, this approach makes the most sense.', true, 14),
('I strongly believe that...', 'sentence', 'article', ARRAY['opinion', 'emphasis'], 'I strongly believe that education is the key to success.', true, 15),
('One of the main advantages is...', 'sentence', 'article', ARRAY['argument', 'advantages'], 'One of the main advantages is that it saves a lot of time.', true, 16),
('On the other hand,...', 'sentence', 'article', ARRAY['contrast', 'argument'], 'On the other hand, there are some disadvantages to consider.', true, 17);

-- Common Linking Words and Phrases
INSERT INTO recommended_phrases (text, type, essay_type, topic_tags, usage_example, is_active, sort_order) VALUES
('Furthermore,', 'phrase', 'general', ARRAY['addition', 'connector'], 'The product is affordable. Furthermore, it comes with a warranty.', true, 20),
('However,', 'phrase', 'general', ARRAY['contrast', 'connector'], 'I wanted to go. However, I had too much work to do.', true, 21),
('As a result,', 'phrase', 'general', ARRAY['result', 'connector'], 'It rained heavily. As a result, the match was cancelled.', true, 22),
('In addition,', 'phrase', 'general', ARRAY['addition', 'connector'], 'She speaks French. In addition, she can speak German.', true, 23),
('For example,', 'phrase', 'general', ARRAY['example', 'connector'], 'Many countries, for example, France and Italy, are famous for their food.', true, 24),
('In conclusion,', 'phrase', 'general', ARRAY['conclusion', 'connector'], 'In conclusion, I believe this is the best option for everyone.', true, 25),
('Moreover,', 'phrase', 'general', ARRAY['addition', 'connector'], 'The hotel was comfortable. Moreover, the staff were very friendly.', true, 26),
('Therefore,', 'phrase', 'general', ARRAY['result', 'connector'], 'He didn''t study. Therefore, he failed the exam.', true, 27);

-- Useful Vocabulary and Phrases
INSERT INTO recommended_phrases (text, type, essay_type, topic_tags, usage_example, is_active, sort_order) VALUES
('outdoor adventure', 'phrase', 'general', ARRAY['vocabulary', 'activities'], 'We had an amazing outdoor adventure in the mountains.', true, 30),
('thrilling experience', 'phrase', 'general', ARRAY['vocabulary', 'feelings'], 'It was a thrilling experience that I will never forget.', true, 31),
('highly recommend', 'phrase', 'general', ARRAY['vocabulary', 'suggestion'], 'I highly recommend visiting this museum.', true, 32),
('have a great time', 'phrase', 'general', ARRAY['vocabulary', 'enjoyment'], 'We had a great time at the concert last night.', true, 33),
('take part in', 'phrase', 'general', ARRAY['vocabulary', 'activities'], 'I would like to take part in this competition.', true, 34),
('be interested in', 'phrase', 'general', ARRAY['vocabulary', 'preferences'], 'I have always been interested in learning new languages.', true, 35),
('look forward to', 'phrase', 'general', ARRAY['vocabulary', 'anticipation'], 'I look forward to meeting you soon.', true, 36),
('deal with', 'phrase', 'general', ARRAY['vocabulary', 'problem-solving'], 'We need to deal with this problem immediately.', true, 37);
