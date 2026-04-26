import { createClient } from '@/lib/supabase/server';
import { getRecommendation } from '@/lib/db/recommended-phrases';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['email', 'article', 'story', 'toolbox'] as const;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const essayType = searchParams.get('essayType') ?? 'email';
  const category = searchParams.get('category') ?? null;

  if (!VALID_TYPES.includes(essayType as typeof VALID_TYPES[number])) {
    return Response.json({ error: 'Invalid essayType' }, { status: 400 });
  }

  try {
    const items = await getRecommendation(essayType, category, user.id);
    return Response.json({ items });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : '获取推荐失败' },
      { status: 500 }
    );
  }
}
