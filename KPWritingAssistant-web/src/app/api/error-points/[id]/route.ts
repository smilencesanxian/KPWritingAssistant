import { createClient } from '@/lib/supabase/server';
import { getErrorPointById } from '@/lib/db/error-points';
import { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const detail = await getErrorPointById(id, user.id);

    if (!detail) {
      return Response.json({ error: '易错点不存在' }, { status: 404 });
    }

    const { instances, ...error_point } = detail;
    return Response.json({ error_point, instances });
  } catch (err) {
    console.error('Failed to get error point:', err);
    return Response.json({ error: '获取易错点详情失败，请重试' }, { status: 500 });
  }
}
