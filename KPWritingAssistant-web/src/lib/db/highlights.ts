import { createClient } from '@/lib/supabase/server';
import type { Highlight } from '@/types/database';

export interface CreateHighlightInput {
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  source?: 'user' | 'system';
  recommended_phrase_id?: string;
  kb_material_id?: string;
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
      const linkResult = h.recommended_phrase_id
        ? { id: h.recommended_phrase_id, is_kb_material: false }
        : await tryLinkToKnowledgeBase(h.text, supabase);

      return {
        ...h,
        recommended_phrase_id: linkResult?.is_kb_material ? null : linkResult?.id,
        kb_material_id: linkResult?.is_kb_material ? linkResult.id : null,
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
    kb_material_id: h.kb_material_id ?? null,
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
    kb_material_id?: string;
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
    if (options?.kb_material_id !== undefined && existing.kb_material_id !== options.kb_material_id) {
      updates.kb_material_id = options.kb_material_id;
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
): Promise<Array<{ id: string; text: string; knowledge_essay_type: string | null }>> {
  const supabase = await createClient();

  const { data: systemData, error: systemError } = await supabase
    .from('highlights_library')
    .select('id, text, knowledge_essay_type')
    .eq('user_id', userId)
    .eq('source', 'system')
    .order('created_at', { ascending: false });

  // If knowledge_essay_type column doesn't exist (migration 008 not applied), fall back to text-only
  if (systemError) {
    if (systemError.message.includes('knowledge_essay_type')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('highlights_library')
        .select('id, text')
        .eq('user_id', userId)
        .eq('source', 'system')
        .order('created_at', { ascending: false });
      if (fallbackError) {
        throw new Error(`Failed to get collected system phrases: ${fallbackError.message}`);
      }
      return (fallbackData ?? []).map((r) => ({ id: r.id, text: r.text, knowledge_essay_type: null }));
    }
    throw new Error(`Failed to get collected system phrases: ${systemError.message}`);
  }

  const { data: userKbData, error: userKbError } = await supabase
    .from('highlights_library')
    .select('id, text, knowledge_essay_type')
    .eq('user_id', userId)
    .eq('source', 'user')
    .not('knowledge_essay_type', 'is', null)
    .order('created_at', { ascending: false });

  // If knowledge_essay_type column doesn't exist, user KB phrases without type filter = empty list
  if (userKbError) {
    if (userKbError.message.includes('knowledge_essay_type')) {
      return (systemData ?? []).map((r) => ({
        id: r.id,
        text: r.text,
        knowledge_essay_type: (r as { id: string; text: string; knowledge_essay_type?: string | null }).knowledge_essay_type ?? null,
      }));
    }
    throw new Error(`Failed to get user knowledge phrases: ${userKbError.message}`);
  }

  return [...(systemData ?? []), ...(userKbData ?? [])] as Array<{
    id: string;
    text: string;
    knowledge_essay_type: string | null;
  }>;
}

// v1.2.3 新增：批量增加知识素材的使用计数
export async function incrementHighlightUsageCount(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = await createClient();
  // Fetch current counts then update (Supabase JS client doesn't support SQL expressions in updates)
  const { data: rows, error: fetchError } = await supabase
    .from('highlights_library')
    .select('id, usage_count')
    .in('id', ids);
  if (fetchError) {
    // Silently ignore if the column doesn't exist yet (migration not applied)
    if (fetchError.message.includes('usage_count')) return;
    console.warn('incrementHighlightUsageCount fetch failed:', fetchError.message);
    return;
  }
  for (const row of rows ?? []) {
    const currentCount = (row as { id: string; usage_count: number }).usage_count ?? 0;
    await supabase
      .from('highlights_library')
      .update({ usage_count: currentCount + 1 })
      .eq('id', (row as { id: string }).id);
  }
}

// v1.2.1 新增：写入时预关联知识库
export async function tryLinkToKnowledgeBase(
  text: string,
  supabaseClient?: Awaited<ReturnType<typeof createClient>>
): Promise<{ id: string; is_kb_material: boolean } | null> {
  const supabase = supabaseClient ?? (await createClient());

  const trimmedText = text.trim();
  if (!trimmedText) return null;

  const { data: kbData, error: kbError } = await supabase
    .from('kb_materials')
    .select('id')
    .ilike('text', trimmedText)
    .eq('is_active', true)
    .maybeSingle();

  if (kbError) {
    throw new Error(`Failed to link to kb materials: ${kbError.message}`);
  }

  if (kbData) {
    return { id: kbData.id, is_kb_material: true };
  }

  const { data: rpData, error: rpError } = await supabase
    .from('recommended_phrases')
    .select('id')
    .ilike('text', trimmedText)
    .eq('is_active', true)
    .maybeSingle();

  if (rpError) {
    throw new Error(`Failed to link to recommended phrases: ${rpError.message}`);
  }

  return rpData ? { id: rpData.id, is_kb_material: false } : null;
}
