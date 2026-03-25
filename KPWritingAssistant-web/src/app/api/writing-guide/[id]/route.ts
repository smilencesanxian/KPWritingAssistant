import { createClient } from '@/lib/supabase/server';
import { deleteUserNode } from '@/lib/db/writing-guide';
import { NextRequest } from 'next/server';

/**
 * DELETE /api/writing-guide/[id]
 * Delete a user writing guide node
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return Response.json({ error: 'Node ID is required' }, { status: 400 });
  }

  try {
    await deleteUserNode(id, user.id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('Failed to delete writing guide node:', err);
    const message = err instanceof Error ? err.message : '删除失败';
    return Response.json(
      { error: message },
      { status: 400 }
    );
  }
}
