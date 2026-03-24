import { detectEssayType } from '@/lib/ai/llm';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { question_ocr_text, essay_ocr_text } = body as Record<string, unknown>;

  // Validate required fields
  if (!essay_ocr_text || typeof essay_ocr_text !== 'string') {
    return Response.json(
      { error: 'essay_ocr_text is required' },
      { status: 400 }
    );
  }

  // Validate essay_ocr_text is not empty
  if (essay_ocr_text.trim().length === 0) {
    return Response.json(
      { error: 'essay_ocr_text cannot be empty' },
      { status: 400 }
    );
  }

  try {
    // Call LLM to detect essay type
    const result = await detectEssayType(
      essay_ocr_text,
      typeof question_ocr_text === 'string' ? question_ocr_text : undefined
    );

    return Response.json(result);
  } catch (err) {
    console.error('Detect type failed:', err);
    return Response.json(
      { error: '题型识别失败，请稍后重试' },
      { status: 500 }
    );
  }
}
