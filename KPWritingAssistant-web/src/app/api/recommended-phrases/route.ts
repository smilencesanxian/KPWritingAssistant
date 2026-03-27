import { getRecommendedPhrases, getKnowledgeBase } from '@/lib/db/recommended-phrases';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['vocabulary', 'phrase', 'sentence'];
const VALID_ESSAY_TYPES = ['email', 'article', 'story', 'general'];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  // Check for grouped mode (knowledge base view)
  const grouped = searchParams.get('grouped') === 'true';
  if (grouped) {
    const essayType = searchParams.get('essayType');
    if (!essayType) {
      return Response.json(
        { error: 'Missing essayType parameter for grouped query' },
        { status: 400 }
      );
    }
    if (!VALID_ESSAY_TYPES.includes(essayType)) {
      return Response.json(
        { error: `Invalid essayType parameter. Must be one of: ${VALID_ESSAY_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    try {
      const sections = await getKnowledgeBase(essayType, user.id);
      return Response.json({ sections });
    } catch (err) {
      console.error('Failed to get knowledge base:', err);
      return Response.json({ error: '获取知识库失败，请重试' }, { status: 500 });
    }
  }

  // Parse and validate type parameter
  const type = searchParams.get('type');
  if (type && !VALID_TYPES.includes(type)) {
    return Response.json(
      { error: 'Invalid type parameter. Must be one of: vocabulary, phrase, sentence' },
      { status: 400 }
    );
  }

  // Parse and validate essay_type parameter
  const essayType = searchParams.get('essay_type');
  if (essayType && !VALID_ESSAY_TYPES.includes(essayType)) {
    return Response.json(
      { error: `Invalid essay_type parameter. Must be one of: ${VALID_ESSAY_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const phrases = await getRecommendedPhrases({
      type: type as 'vocabulary' | 'phrase' | 'sentence' | undefined,
      essayType: essayType as 'email' | 'article' | 'general' | undefined,
    });

    // Group by essay_type for better frontend consumption
    const grouped = phrases.reduce((acc, phrase) => {
      const key = phrase.essay_type ?? 'general';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(phrase);
      return acc;
    }, {} as Record<string, typeof phrases>);

    return Response.json({ phrases: grouped });
  } catch (err) {
    console.error('Failed to get recommended phrases:', err);
    return Response.json({ error: '获取推荐句式失败，请重试' }, { status: 500 });
  }
}
