import { createClient } from '@/lib/supabase/server';
import type { RecommendedPhrase, Highlight } from '@/types/database';

function normalizePhraseKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

function dedupePhrases<T extends { text: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = normalizePhraseKey(item.text);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

export interface GetRecommendedPhrasesOptions {
  essayType?: 'email' | 'article' | 'story' | 'general' | null;
  topicTags?: string[];
  type?: 'vocabulary' | 'phrase' | 'sentence';
  limit?: number;
}

export async function getRecommendedPhrases(
  options: GetRecommendedPhrasesOptions = {}
): Promise<RecommendedPhrase[]> {
  const supabase = await createClient();

  let query = supabase
    .from('recommended_phrases')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (options.essayType) {
    query = query.or(`essay_type.eq.${options.essayType},essay_type.is.null`);
  }

  if (options.type) {
    query = query.eq('type', options.type);
  }

  if (options.topicTags && options.topicTags.length > 0) {
    // Filter by topic tags using overlap operator
    query = query.overlaps('topic_tags', options.topicTags);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get recommended phrases: ${error.message}`);
  }

  return dedupePhrases((data ?? []) as RecommendedPhrase[]);
}

export interface CollectPhraseInput {
  userId: string;
  phraseId: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
}

export async function collectPhrase(input: CollectPhraseInput): Promise<Highlight> {
  const supabase = await createClient();

  // Check if already collected
  const { data: existing } = await supabase
    .from('highlights_library')
    .select('*')
    .eq('user_id', input.userId)
    .eq('recommended_phrase_id', input.phraseId)
    .maybeSingle();

  if (existing) {
    return existing as Highlight;
  }

  // Create new highlight from recommended phrase
  const { data, error } = await supabase
    .from('highlights_library')
    .insert({
      user_id: input.userId,
      text: input.text,
      type: input.type,
      source: 'system',
      recommended_phrase_id: input.phraseId,
      source_submission_id: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to collect phrase: ${error.message}`);
  }

  return data as Highlight;
}

export async function isCollected(
  userId: string,
  phraseId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('highlights_library')
    .select('id')
    .eq('user_id', userId)
    .eq('recommended_phrase_id', phraseId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check collection status: ${error.message}`);
  }

  return data !== null;
}

// v1.2.1 新增：知识库相关类型和函数

export interface KnowledgeItem {
  id: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  level: 'basic' | 'advanced' | null;
  category: string | null;
  source: 'system' | 'user';
  is_collected: boolean;
  is_in_highlights: boolean;
  highlight_id?: string | null;
  usage_count?: number;
}

export interface KnowledgeSection {
  category: string;
  category_label: string;
  items: KnowledgeItem[];
}

// 分类标签映射
export const CATEGORY_LABELS: Record<string, string> = {
  opening: '开篇引入',
  opinion: '观点表达',
  connector: '逻辑连接',
  detail: '细节描述',
  closing: '结尾升华',
  title: '标题设计',
  plot: '情节发展',
  emotion: '情感表达',
  emotion_vocab: '情绪词汇',
  action_vocab: '动作词汇',
  adverb: '程度副词',
  complex_sentence: '高级句式',
};

export function getCategoryLabel(category: string | null): string {
  if (!category) return '其他';
  return CATEGORY_LABELS[category] || category;
}

export async function getKnowledgeBase(
  essayType: string,
  userId: string
): Promise<KnowledgeSection[]> {
  const supabase = await createClient();

  // 1. 查询系统推荐短语（匹配指定类型或 general）
  const { data: phrases, error: phrasesError } = await supabase
    .from('recommended_phrases')
    .select('*')
    .eq('is_active', true)
    .or(`essay_type.eq.${essayType},essay_type.eq.general`)
    .order('sort_order', { ascending: true });

  if (phrasesError) {
    throw new Error(`Failed to get recommended phrases: ${phrasesError.message}`);
  }

  // 2. 查询用户 highlights 中所有有 recommended_phrase_id 的条目
  const { data: highlights, error: highlightsError } = await supabase
    .from('highlights_library')
    .select('id, source, recommended_phrase_id, usage_count')
    .eq('user_id', userId)
    .not('recommended_phrase_id', 'is', null);

  if (highlightsError) {
    throw new Error(`Failed to get highlights: ${highlightsError.message}`);
  }

  // 3. 构建 Map 用于 O(1) 状态查找
  // Map<phraseId, { source, id, usage_count }>
  const highlightMap = new Map<string, { source: 'system' | 'user'; id: string; usage_count: number }>();
  for (const h of highlights ?? []) {
    if (h.recommended_phrase_id) {
      highlightMap.set(h.recommended_phrase_id, {
        source: h.source,
        id: h.id,
        usage_count: (h as { usage_count?: number }).usage_count ?? 0,
      });
    }
  }

  // 4. 处理系统推荐条目
  const systemItems: KnowledgeItem[] = (phrases ?? []).map((phrase) => {
    const highlightInfo = highlightMap.get(phrase.id);
    return {
      id: phrase.id,
      text: phrase.text,
      type: phrase.type,
      level: phrase.level,
      category: phrase.category,
      source: 'system',
      is_collected: highlightInfo?.source === 'system',
      is_in_highlights: highlightInfo?.source === 'user',
      highlight_id: highlightInfo?.id || null,
      usage_count: highlightInfo?.usage_count ?? 0,
    };
  });

  // 5. 查询并追加用户自定义条目
  // 用户自定义：source='user' 且 recommended_phrase_id IS NULL 且 knowledge_essay_type 匹配
  const { data: userCustomHighlights, error: userError } = await supabase
    .from('highlights_library')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'user')
    .is('recommended_phrase_id', null)
    .eq('knowledge_essay_type', essayType);

  if (userError) {
    throw new Error(`Failed to get user custom highlights: ${userError.message}`);
  }

  const userItems: KnowledgeItem[] = (userCustomHighlights ?? []).map((h) => ({
    id: h.id,
    text: h.text,
    type: h.type,
    level: null,
    category: null,
    source: 'user',
    is_collected: false,
    is_in_highlights: true,
    highlight_id: h.id,
    usage_count: (h as { usage_count?: number }).usage_count ?? 0,
  }));

  // 6. 合并所有条目
  const allItems = dedupePhrases([...systemItems, ...userItems]);

  // 7. 按 category 分组
  const grouped = new Map<string, KnowledgeItem[]>();
  for (const item of allItems) {
    const category = item.category || 'other';
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(item);
  }

  // 8. 构建结果数组，保持特定分类顺序
  const categoryOrder = [
    'opening',
    'opinion',
    'connector',
    'detail',
    'closing',
    'title',
    'plot',
    'emotion',
    'emotion_vocab',
    'action_vocab',
    'adverb',
    'complex_sentence',
    'other',
  ];

  const result: KnowledgeSection[] = [];
  for (const category of categoryOrder) {
    const items = grouped.get(category);
    if (items && items.length > 0) {
      result.push({
        category,
        category_label: getCategoryLabel(category),
        items,
      });
    }
  }

  // 添加未在预定义顺序中的分类
  for (const [category, items] of grouped.entries()) {
    if (!categoryOrder.includes(category)) {
      result.push({
        category,
        category_label: getCategoryLabel(category),
        items,
      });
    }
  }

  return result;
}

/** 推荐功能：根据作文类型和素材分类，返回2条用户尚未收藏的推荐素材 */
export async function getRecommendation(
  essayType: string,
  category: string | null,
  userId: string
): Promise<KnowledgeItem[]> {
  const supabase = await createClient();

  // 获取用户已收藏的 recommended_phrase_id 列表
  const { data: collected } = await supabase
    .from('highlights_library')
    .select('recommended_phrase_id')
    .eq('user_id', userId)
    .eq('source', 'system')
    .not('recommended_phrase_id', 'is', null);

  const collectedIds = new Set((collected ?? []).map((h) => h.recommended_phrase_id as string));

  // 查询匹配类型和分类的未收藏条目
  let query = supabase
    .from('recommended_phrases')
    .select('*')
    .eq('is_active', true)
    .or(`essay_type.eq.${essayType},essay_type.eq.general`)
    .limit(30);

  if (category) {
    query = query.eq('category', category);
  }

  const { data: phrases, error } = await query;
  if (error) throw new Error(`Failed to get recommendations: ${error.message}`);

  const uncollected = (phrases ?? []).filter((p) => !collectedIds.has(p.id));

  // 随机取2条
  const shuffled = uncollected.sort(() => Math.random() - 0.5).slice(0, 2);

  return dedupePhrases(shuffled).map((phrase) => ({
    id: phrase.id,
    text: phrase.text,
    type: phrase.type,
    level: phrase.level,
    category: phrase.category,
    source: 'system' as const,
    is_collected: false,
    is_in_highlights: false,
    usage_count: 0,
  }));
}
