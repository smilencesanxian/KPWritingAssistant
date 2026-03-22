import { createClient } from '@/lib/supabase/server';
import { getErrorPoints } from '@/lib/db/error-points';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const flaggedOnly = searchParams.get('flagged_only') === 'true';

  try {
    const error_points = await getErrorPoints(user.id, { flaggedOnly });
    return Response.json({ error_points });
  } catch (err) {
    console.error('Failed to get error points:', err);
    return Response.json({ error: '获取易错点列表失败，请重试' }, { status: 500 });
  }
}
