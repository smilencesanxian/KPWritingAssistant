import { createClient } from '@/lib/supabase/server';
import { UserStats } from '@/types/database';
import { SubmissionWithScore } from '@/lib/db/essays';

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const [
    { count: corrections_count, error: e1 },
    { count: highlights_count, error: e2 },
    { count: error_points_count, error: e3 },
    { count: flagged_error_count, error: e4 },
  ] = await Promise.all([
    supabase
      .from('corrections')
      .select('essay_submissions!inner(user_id)', { count: 'exact', head: true })
      .eq('essay_submissions.user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('highlights_library')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('error_points')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('error_points')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_flagged', true),
  ]);

  if (e1) throw new Error(`Failed to get corrections count: ${e1.message}`);
  if (e2) throw new Error(`Failed to get highlights count: ${e2.message}`);
  if (e3) throw new Error(`Failed to get error points count: ${e3.message}`);
  if (e4) throw new Error(`Failed to get flagged error count: ${e4.message}`);

  return {
    corrections_count: corrections_count ?? 0,
    highlights_count: highlights_count ?? 0,
    error_points_count: error_points_count ?? 0,
    flagged_error_count: flagged_error_count ?? 0,
  };
}

export async function getRecentSubmissions(
  userId: string,
  limit = 3
): Promise<SubmissionWithScore[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('essay_submissions')
    .select('*, corrections(id, total_score)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get recent submissions: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const correction = Array.isArray(row.corrections) ? row.corrections[0] : row.corrections;
    return {
      ...(row as unknown as import('@/types/database').Submission),
      correction_id: correction?.id ?? null,
      total_score: correction?.total_score ?? null,
    };
  });
}
