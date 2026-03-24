import { getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { NextRequest } from 'next/server';

const VALID_TYPES = ['vocabulary', 'phrase', 'sentence'];
const VALID_ESSAY_TYPES = ['email', 'article', 'general'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

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
      { error: 'Invalid essay_type parameter. Must be one of: email, article, general' },
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
