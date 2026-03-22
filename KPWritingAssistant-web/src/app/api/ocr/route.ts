import { createClient } from '@/lib/supabase/server';
import { recognizeHandwriting } from '@/lib/ocr';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { image_url } = body as Record<string, unknown>;

  if (!image_url || typeof image_url !== 'string' || image_url.trim() === '') {
    return Response.json({ error: 'image_url is required' }, { status: 400 });
  }

  // Fetch the image from the URL and convert to base64
  let imageBase64: string;
  try {
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: HTTP ${imageResponse.status}`);
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    imageBase64 = Buffer.from(arrayBuffer).toString('base64');
  } catch (err) {
    console.error('Failed to fetch image for OCR:', err);
    return Response.json(
      { error: '图片获取失败，请重新上传后重试' },
      { status: 500 }
    );
  }

  try {
    const result = await recognizeHandwriting(imageBase64);
    return Response.json({ text: result.text, confidence: result.confidence });
  } catch (err) {
    console.error('OCR recognition failed:', err);
    const message =
      err instanceof Error ? err.message : '图片识别失败，请检查图片清晰度后重试';
    return Response.json({ error: message }, { status: 500 });
  }
}
