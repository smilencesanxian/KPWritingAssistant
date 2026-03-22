import { createClient } from '@/lib/supabase/server';
import type { Highlight } from '@/types/database';

export interface CreateHighlightInput {
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
}

export async function createHighlights(
  userId: string,
  highlights: CreateHighlightInput[],
  sourceSubmissionId?: string
): Promise<Highlight[]> {
  const supabase = await createClient();

  const rows = highlights.map((h) => ({
    user_id: userId,
    text: h.text,
    type: h.type,
    source_submission_id: sourceSubmissionId ?? null,
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

  const { data, error } = await supabase
    .from('highlights_library')
    .insert({
      user_id: userId,
      text,
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
