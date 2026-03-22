import { createClient } from '@/lib/supabase/server';
import { getSubmissionById, deleteSubmission } from '@/lib/db/essays';
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
    const essay = await getSubmissionById(id, user.id);
    if (!essay) {
      return Response.json({ error: 'Essay not found' }, { status: 404 });
    }
    return Response.json({ essay });
  } catch (err) {
    console.error('Failed to get submission:', err);
    return Response.json({ error: '获取作文详情失败，请重试' }, { status: 500 });
  }
}

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

  try {
    await deleteSubmission(id, user.id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('Failed to delete submission:', err);
    return Response.json({ error: '删除失败，请重试' }, { status: 500 });
  }
}
