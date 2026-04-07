import { createClient } from '@/lib/supabase/server';
import type { ModelEssay, EditHistoryItem } from '@/types/database';

export interface UpdateModelEssayInput {
  user_edited_content?: string;
  is_user_edited?: boolean;
  edit_history?: EditHistoryItem[];
  user_preference_notes?: string;
}

export async function updateModelEssay(
  id: string,
  data: UpdateModelEssayInput
): Promise<void> {
  const supabase = await createClient();

  // Build update object dynamically
  const updateData: Record<string, unknown> = {};

  if (data.user_edited_content !== undefined) {
    updateData.user_edited_content = data.user_edited_content;
  }
  if (data.is_user_edited !== undefined) {
    updateData.is_user_edited = data.is_user_edited;
  }
  if (data.user_preference_notes !== undefined) {
    updateData.user_preference_notes = data.user_preference_notes;
  }

  // Handle edit_history - append new entry if provided
  if (data.edit_history && data.edit_history.length > 0) {
    // Fetch existing edit_history
    const { data: existing } = await supabase
      .from('model_essays')
      .select('edit_history')
      .eq('id', id)
      .single();

    const existingHistory = (existing?.edit_history as EditHistoryItem[]) ?? [];
    const newHistory = [...existingHistory, ...data.edit_history];
    updateData.edit_history = newHistory;
  }

  // Do UPDATE only — no .select() to avoid RLS issues on model_essays
  // (model_essays has no direct user_id column so SELECT-after-UPDATE fails RLS)
  const { error } = await supabase
    .from('model_essays')
    .update(updateData)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update model essay: ${error.message}`);
  }
}

export async function getUserPreferenceNotes(
  userId: string,
  limit: number = 5
): Promise<string[]> {
  const supabase = await createClient();

  // Join through corrections and essay_submissions to filter by user_id
  const { data, error } = await supabase
    .from('model_essays')
    .select('user_preference_notes, corrections!inner(submission_id), essay_submissions!inner(user_id)')
    .eq('essay_submissions.user_id', userId)
    .not('user_preference_notes', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get preference notes: ${error.message}`);
  }

  // Filter out nulls and return array of strings
  return (data ?? [])
    .map((item) => item.user_preference_notes)
    .filter((note): note is string => note !== null);
}
