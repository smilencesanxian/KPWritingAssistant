import { createClient } from '@/lib/supabase/server';
import { createSubmission, getSubmissions } from '@/lib/db/essays';
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

  const {
    ocr_text,
    original_image_path,
    title,
    exam_part,
    question_type,
    question_image_path,
    question_ocr_text,
    essay_topic,
  } = body as Record<string, unknown>;

  try {
    const submission = await createSubmission(user.id, {
      ocr_text: typeof ocr_text === 'string' ? ocr_text : undefined,
      original_image_path: typeof original_image_path === 'string' ? original_image_path : undefined,
      title: typeof title === 'string' ? title : undefined,
      exam_part: (exam_part === 'part1' || exam_part === 'part2') ? exam_part : null,
      question_type: (question_type === 'q1' || question_type === 'q2') ? question_type : null,
      question_image_path: typeof question_image_path === 'string' ? question_image_path : null,
      question_ocr_text: typeof question_ocr_text === 'string' ? question_ocr_text : null,
      essay_topic: typeof essay_topic === 'string' ? essay_topic : null,
    });
    return Response.json({ submission }, { status: 201 });
  } catch (err) {
    console.error('Failed to create submission:', err);
    return Response.json({ error: '创建作文记录失败，请重试' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));

  try {
    const { essays, total } = await getSubmissions(user.id, { page, limit });
    return Response.json({ essays, total, page, limit });
  } catch (err) {
    console.error('Failed to get submissions:', err);
    return Response.json({ error: '获取作文列表失败，请重试' }, { status: 500 });
  }
}
