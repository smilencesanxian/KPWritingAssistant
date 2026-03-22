import { createClient } from '@/lib/supabase/server';

export async function uploadEssayImage(
  userId: string,
  submissionId: string,
  file: File | Buffer,
  ext: string
): Promise<{ path: string; url: string }> {
  const supabase = await createClient();
  const path = `${userId}/${submissionId}.${ext}`;

  const fileBuffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

  const { error } = await supabase.storage
    .from('essay-images')
    .upload(path, fileBuffer, {
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload essay image: ${error.message}`);
  }

  const url = await getSignedUrl('essay-images', path);
  return { path, url };
}

export async function uploadCopybookPDF(
  userId: string,
  copybookId: string,
  pdfBuffer: Buffer
): Promise<{ path: string; url: string }> {
  const supabase = await createClient();
  const path = `${userId}/${copybookId}.pdf`;

  const { error } = await supabase.storage
    .from('copybook-pdfs')
    .upload(path, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload copybook PDF: ${error.message}`);
  }

  const { data } = supabase.storage.from('copybook-pdfs').getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to get signed URL: ${error?.message ?? 'unknown error'}`);
  }

  return data.signedUrl;
}
