import { createClient } from '@/lib/supabase/server';
import { deleteHighlight } from '@/lib/db/highlights';
import { NextRequest } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return Response.json({ error: '缺少亮点 ID' }, { status: 400 });
  }

  // Check if the highlight exists and belongs to the user
  const { data: existing } = await supabase
    .from('highlights_library')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return Response.json({ error: '亮点不存在' }, { status: 404 });
  }

  if (existing.user_id !== user.id) {
    return Response.json({ error: '无权限删除此亮点' }, { status: 403 });
  }

  try {
    await deleteHighlight(id, user.id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('Failed to delete highlight:', err);
    return Response.json({ error: '删除亮点失败，请重试' }, { status: 500 });
  }
}
