import { createClient } from '@/lib/supabase/server';
import type { ErrorPoint, ErrorInstance, ErrorPointDetail } from '@/types/database';
import type { ErrorAnnotation, ErrorSummaryItem } from '@/types/ai';

export interface CreateErrorInstanceInput {
  original_sentence?: string;
  corrected_sentence?: string;
  explanation?: string;
}

export async function upsertErrorPoint(
  userId: string,
  errorType: string,
  errorTypeLabel: string
): Promise<ErrorPoint> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('error_points')
    .select('*')
    .eq('user_id', userId)
    .eq('error_type', errorType)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('error_points')
      .update({
        occurrence_count: existing.occurrence_count + 1,
        last_seen_at: new Date().toISOString(),
        error_type_label: errorTypeLabel,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update error point: ${error.message}`);
    return data as ErrorPoint;
  }

  const { data, error } = await supabase
    .from('error_points')
    .insert({
      user_id: userId,
      error_type: errorType,
      error_type_label: errorTypeLabel,
      occurrence_count: 1,
      is_flagged: false,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to insert error point: ${error.message}`);
  return data as ErrorPoint;
}

export async function flagIfNeeded(errorPointId: string): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('error_points')
    .select('occurrence_count')
    .eq('id', errorPointId)
    .single();

  if (error) throw new Error(`Failed to fetch error point: ${error.message}`);

  if (data && data.occurrence_count >= 2) {
    const { error: updateError } = await supabase
      .from('error_points')
      .update({ is_flagged: true })
      .eq('id', errorPointId);

    if (updateError) throw new Error(`Failed to flag error point: ${updateError.message}`);
  }
}

export async function createErrorInstance(
  errorPointId: string,
  submissionId: string,
  data: CreateErrorInstanceInput
): Promise<ErrorInstance> {
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from('error_instances')
    .insert({
      error_point_id: errorPointId,
      submission_id: submissionId,
      original_sentence: data.original_sentence ?? null,
      corrected_sentence: data.corrected_sentence ?? null,
      explanation: data.explanation ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create error instance: ${error.message}`);
  return created as ErrorInstance;
}

export async function getErrorPoints(
  userId: string,
  options?: { flaggedOnly?: boolean }
): Promise<ErrorPoint[]> {
  const supabase = await createClient();

  let query = supabase
    .from('error_points')
    .select('*')
    .eq('user_id', userId)
    .order('occurrence_count', { ascending: false });

  if (options?.flaggedOnly) {
    query = query.eq('is_flagged', true);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get error points: ${error.message}`);
  return (data ?? []) as ErrorPoint[];
}

export async function getErrorPointById(
  id: string,
  userId: string
): Promise<ErrorPointDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('error_points')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get error point: ${error.message}`);
  }

  if (!data) return null;

  const { data: instances, error: instancesError } = await supabase
    .from('error_instances')
    .select('*')
    .eq('error_point_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (instancesError) throw new Error(`Failed to get error instances: ${instancesError.message}`);

  return {
    ...(data as ErrorPoint),
    instances: (instances ?? []) as ErrorInstance[],
  };
}

export async function processErrorsFromCorrection(
  userId: string,
  submissionId: string,
  errorSummary: ErrorSummaryItem[],
  errorAnnotations: ErrorAnnotation[]
): Promise<ErrorPoint[]> {
  const newlyFlaggedPoints: ErrorPoint[] = [];

  for (const summaryItem of errorSummary) {
    const wasAlreadyFlagged = await isAlreadyFlagged(userId, summaryItem.error_type);

    const errorPoint = await upsertErrorPoint(
      userId,
      summaryItem.error_type,
      summaryItem.error_type_label
    );

    await flagIfNeeded(errorPoint.id);

    if (!wasAlreadyFlagged && errorPoint.occurrence_count + 1 >= 2) {
      const supabase = await createClient();
      const { data: updated } = await supabase
        .from('error_points')
        .select('*')
        .eq('id', errorPoint.id)
        .single();

      if (updated && (updated as ErrorPoint).is_flagged) {
        newlyFlaggedPoints.push(updated as ErrorPoint);
      }
    }

    const matchingAnnotations = errorAnnotations.filter(
      (a) => a.error_type === summaryItem.error_type
    );

    for (const annotation of matchingAnnotations) {
      await createErrorInstance(errorPoint.id, submissionId, {
        original_sentence: annotation.original,
        corrected_sentence: annotation.corrected,
        explanation: annotation.explanation,
      });
    }
  }

  return newlyFlaggedPoints;
}

async function isAlreadyFlagged(userId: string, errorType: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('error_points')
    .select('is_flagged')
    .eq('user_id', userId)
    .eq('error_type', errorType)
    .single();

  return data?.is_flagged === true;
}

export async function deleteErrorPoint(id: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Verify ownership
  const { data: errorPoint } = await supabase
    .from('error_points')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!errorPoint) {
    throw new Error('Error point not found or unauthorized');
  }

  // Cascade delete: error_instances first, then error_point
  const { error: instancesError } = await supabase
    .from('error_instances')
    .delete()
    .eq('error_point_id', id);

  if (instancesError) {
    throw new Error(`Failed to delete error instances: ${instancesError.message}`);
  }

  const { error } = await supabase
    .from('error_points')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete error point: ${error.message}`);
  }
}
