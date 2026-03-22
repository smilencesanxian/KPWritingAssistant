import { createClient } from '@/lib/supabase/server';
import { getUserStats, getRecentSubmissions } from '@/lib/db/stats';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [stats, recent_submissions] = await Promise.all([
      getUserStats(user.id),
      getRecentSubmissions(user.id),
    ]);

    return Response.json({
      corrections_count: stats.corrections_count,
      highlights_count: stats.highlights_count,
      error_points_count: stats.error_points_count,
      flagged_error_count: stats.flagged_error_count,
      recent_submissions,
    });
  } catch (err) {
    console.error('Failed to get stats:', err);
    return Response.json({ error: '获取统计数据失败，请重试' }, { status: 500 });
  }
}
