import { createClient } from '@/lib/supabase/server';
import type { RecommendedPhrase, Highlight } from '@/types/database';

export interface GetRecommendedPhrasesOptions {
  essayType?: 'email' | 'article' | 'general' | null;
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

  return (data ?? []) as RecommendedPhrase[];
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
