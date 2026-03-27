import { createClient } from '@/lib/supabase/server';
import type { Highlight } from '@/types/database';

export interface CreateHighlightInput {
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  source?: 'user' | 'system';
  recommended_phrase_id?: string;
}

export async function createHighlights(
  userId: string,
  highlights: CreateHighlightInput[],
  sourceSubmissionId?: string
): Promise<Highlight[]> {
  if (highlights.length === 0) return [];

  const supabase = await createClient();

  // Fetch existing highlight texts for this user to deduplicate
  const { data: existing } = await supabase
    .from('highlights_library')
    .select('text')
    .eq('user_id', userId);

  const existingTexts = new Set(
    (existing ?? []).map((h) => h.text.trim().toLowerCase())
  );

  // Filter out duplicates (case-insensitive)
  const uniqueHighlights = highlights.filter(
    (h) => !existingTexts.has(h.text.trim().toLowerCase())
  );

  if (uniqueHighlights.length === 0) return [];

  // Pre-link each highlight to knowledge base before writing
  const highlightsWithLinks = await Promise.all(
    uniqueHighlights.map(async (h) => {
      const phraseId = h.recommended_phrase_id ?? await tryLinkToKnowledgeBase(h.text, supabase);
      return {
        ...h,
        recommended_phrase_id: phraseId,
      };
    })
  );

  const rows = highlightsWithLinks.map((h) => ({
    user_id: userId,
    text: h.text,
    type: h.type,
    source_submission_id: sourceSubmissionId ?? null,
    source: h.source ?? 'user',
    recommended_phrase_id: h.recommended_phrase_id ?? null,
  }));

  const { data, error } = await supabase
    .from('highlights_library')
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to create highlights: ${error.message}`);
  }

  return (data ?? []) as Highlight[];
}

export async function getHighlights(
  userId: string,
  options?: { search?: string; type?: string; page?: number; limit?: number }
): Promise<{ highlights: Highlight[]; total: number }> {
  const supabase = await createClient();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('highlights_library')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (options?.search) {
    query = query.ilike('text', `%${options.search}%`);
  }

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get highlights: ${error.message}`);
  }

  return {
    highlights: (data ?? []) as Highlight[],
    total: count ?? 0,
  };
}

export async function deleteHighlight(
  id: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('highlights_library')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete highlight: ${error.message}`);
  }
}

export async function getHighlightsBySubmissionId(
  submissionId: string
): Promise<Highlight[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('highlights_library')
    .select('*')
    .eq('source_submission_id', submissionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get highlights by submission: ${error.message}`);
  }

  return (data ?? []) as Highlight[];
}

export async function addHighlightManually(
  userId: string,
  text: string,
  type: string,
  options?: {
    knowledge_essay_type?: 'email' | 'article' | 'story' | 'general';
    recommended_phrase_id?: string;
  }
): Promise<Highlight> {
  const supabase = await createClient();

  // Check for existing highlight with the same text (case-insensitive)
  const { data: existing } = await supabase
    .from('highlights_library')
    .select('*')
    .eq('user_id', userId)
    .ilike('text', text.trim())
    .maybeSingle();

  if (existing) {
    // If type changed or options changed, update it; otherwise return existing
    const updates: Partial<Highlight> = {};
    if (existing.type !== type) {
      updates.type = type as 'vocabulary' | 'phrase' | 'sentence';
    }
    if (options?.knowledge_essay_type !== undefined && existing.knowledge_essay_type !== options.knowledge_essay_type) {
      updates.knowledge_essay_type = options.knowledge_essay_type;
    }
    if (options?.recommended_phrase_id !== undefined && existing.recommended_phrase_id !== options.recommended_phrase_id) {
      updates.recommended_phrase_id = options.recommended_phrase_id;
    }

    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updateError } = await supabase
        .from('highlights_library')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update highlight: ${updateError.message}`);
      }
      return updated as Highlight;
    }
    return existing as Highlight;
  }

  const { data, error } = await supabase
    .from('highlights_library')
    .insert({
      user_id: userId,
      text: text.trim(),
      type,
      source_submission_id: null,
      knowledge_essay_type: options?.knowledge_essay_type ?? null,
      recommended_phrase_id: options?.recommended_phrase_id ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add highlight: ${error.message}`);
  }

  return data as Highlight;
}

export async function getCollectedSystemPhrases(
  userId: string
): Promise<Array<{ text: string; knowledge_essay_type: string | null }>> {
  const supabase = await createClient();

  const { data: systemData, error: systemError } = await supabase
    .from('highlights_library')
    .select('text, knowledge_essay_type')
    .eq('user_id', userId)
    .eq('source', 'system')
    .order('created_at', { ascending: false });

  if (systemError) {
    throw new Error(`Failed to get collected system phrases: ${systemError.message}`);
  }

  const { data: userKbData, error: userKbError } = await supabase
    .from('highlights_library')
    .select('text, knowledge_essay_type')
    .eq('user_id', userId)
    .eq('source', 'user')
    .not('knowledge_essay_type', 'is', null)
    .order('created_at', { ascending: false });

  if (userKbError) {
    throw new Error(`Failed to get user knowledge phrases: ${userKbError.message}`);
  }

  return [...(systemData ?? []), ...(userKbData ?? [])] as Array<{
    text: string;
    knowledge_essay_type: string | null;
  }>;
}

// v1.2.1 新增：写入时预关联知识库
export async function tryLinkToKnowledgeBase(
  text: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const supabase = supabaseClient ?? (await createClient());

  const trimmedText = text.trim();
  if (!trimmedText) return null;

  // 使用 ilike 进行大小写不敏感匹配，但要求完整文本匹配
  const { data, error } = await supabase
    .from('recommended_phrases')
    .select('id')
    .ilike('text', trimmedText)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to link to knowledge base: ${error.message}`);
  }

  return data?.id ?? null;
}
