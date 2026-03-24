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

  const rows = uniqueHighlights.map((h) => ({
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
  type: string
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
    // If type changed, update it; otherwise return existing
    if (existing.type !== type) {
      const { data: updated, error: updateError } = await supabase
        .from('highlights_library')
        .update({ type })
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add highlight: ${error.message}`);
  }

  return data as Highlight;
}
