import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKnowledgeBaseSections } from '@/lib/db/knowledge-base';
import { KB_TABS } from '@/types/knowledge-base';

const VALID_CATEGORY_SLUGS = KB_TABS.map((t) => t.slug);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const categorySlug = searchParams.get('categorySlug');
  const searchQuery = searchParams.get('search');

  if (categorySlug && !VALID_CATEGORY_SLUGS.includes(categorySlug as typeof VALID_CATEGORY_SLUGS[number])) {
    return Response.json(
      { error: `Invalid categorySlug. Must be one of: ${VALID_CATEGORY_SLUGS.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const sections = await getKnowledgeBaseSections(
      categorySlug || undefined,
      user?.id,
      searchQuery ?? undefined
    );

    return Response.json({ sections });
  } catch (err) {
    console.error('Failed to get knowledge base sections:', err);
    return Response.json({ error: '获取知识库失败，请重试' }, { status: 500 });
  }
}
