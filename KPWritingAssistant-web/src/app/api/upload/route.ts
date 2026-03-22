import { createClient } from '@/lib/supabase/server';
import { getSignedUrl } from '@/lib/storage/upload';
import { NextRequest } from 'next/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: '不支持的文件类型，请上传 JPG、PNG 或 WebP 格式的图片' },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json(
      { error: '文件大小超过限制，请上传小于 10MB 的图片' },
      { status: 413 }
    );
  }

  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[file.type];
  const timestamp = Date.now();
  const storagePath = `${user.id}/${timestamp}.${ext}`;

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('essay-images')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return Response.json({ error: '图片上传失败，请重试' }, { status: 500 });
  }

  let url: string;
  try {
    url = await getSignedUrl('essay-images', storagePath, 3600);
  } catch (err) {
    console.error('Signed URL error:', err);
    return Response.json({ error: '获取图片链接失败' }, { status: 500 });
  }

  return Response.json({ storage_path: storagePath, url });
}
