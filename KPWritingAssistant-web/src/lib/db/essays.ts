import { createClient } from '@/lib/supabase/server';
import { Submission, SubmissionDetail } from '@/types/database';

export interface CreateSubmissionInput {
  ocr_text?: string;
  original_image_path?: string;
  title?: string;
}

export interface SubmissionWithScore extends Submission {
  correction_id: string | null;
  total_score: number | null;
}

export async function createSubmission(
  userId: string,
  data: CreateSubmissionInput
): Promise<Submission> {
  const supabase = await createClient();

  const { data: submission, error } = await supabase
    .from('essay_submissions')
    .insert({
      user_id: userId,
      ocr_text: data.ocr_text ?? null,
      original_image_path: data.original_image_path ?? null,
      title: data.title ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create submission: ${error.message}`);
  }

  return submission as Submission;
}

export async function getSubmissions(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<{ essays: SubmissionWithScore[]; total: number }> {
  const supabase = await createClient();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('essay_submissions')
    .select('*, corrections(id, total_score)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to get submissions: ${error.message}`);
  }

  const essays: SubmissionWithScore[] = (data ?? []).map((row) => {
    const correction = Array.isArray(row.corrections) ? row.corrections[0] : row.corrections;
    return {
      ...(row as unknown as Submission),
      correction_id: correction?.id ?? null,
      total_score: correction?.total_score ?? null,
    };
  });

  return { essays, total: count ?? 0 };
}

export async function getSubmissionById(
  submissionId: string,
  userId: string
): Promise<SubmissionDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('essay_submissions')
    .select(
      `
      *,
      correction:corrections(
        *,
        model_essays(*)
      )
    `
    )
    .eq('id', submissionId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get submission: ${error.message}`);
  }

  return data as unknown as SubmissionDetail;
}

export async function updateSubmissionStatus(
  id: string,
  status: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('essay_submissions')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update submission status: ${error.message}`);
  }
}

export async function deleteSubmission(id: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Verify ownership
  const { data: submission } = await supabase
    .from('essay_submissions')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!submission) {
    throw new Error('Submission not found or unauthorized');
  }

  // Cascade delete manually (FK constraints lack CASCADE DELETE)
  // 1. Get correction id
  const { data: correction } = await supabase
    .from('corrections')
    .select('id')
    .eq('submission_id', id)
    .maybeSingle();

  if (correction) {
    // 2. Get model essay ids
    const { data: modelEssays } = await supabase
      .from('model_essays')
      .select('id')
      .eq('correction_id', correction.id);

    if (modelEssays && modelEssays.length > 0) {
      const modelEssayIds = modelEssays.map((m) => m.id);
      // 3. Delete copybooks for those model essays
      await supabase.from('copybooks').delete().in('model_essay_id', modelEssayIds);
      // 4. Delete model essays
      await supabase.from('model_essays').delete().in('id', modelEssayIds);
    }

    // 5. Delete correction
    await supabase.from('corrections').delete().eq('id', correction.id);
  }

  // 6. Delete error instances linked to this submission
  await supabase.from('error_instances').delete().eq('submission_id', id);

  // 7. Nullify highlights source reference (keep highlights, just remove link)
  await supabase
    .from('highlights_library')
    .update({ source_submission_id: null })
    .eq('source_submission_id', id);

  // 8. Delete the submission
  const { error } = await supabase
    .from('essay_submissions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete submission: ${error.message}`);
  }
}
