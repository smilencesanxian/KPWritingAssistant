import { createClient } from '@/lib/supabase/server';
import { getWritingGuideTree } from '@/lib/db/writing-guide';
import { NextRequest } from 'next/server';

/**
 * GET /api/writing-guide
 * Returns the writing guide tree for the current user
 * Combines user nodes and system nodes
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tree = await getWritingGuideTree(user.id);
    return Response.json({ tree });
  } catch (err) {
    console.error('Failed to get writing guide:', err);
    return Response.json(
      { error: '获取写作导览失败，请重试' },
      { status: 500 }
    );
  }
}
