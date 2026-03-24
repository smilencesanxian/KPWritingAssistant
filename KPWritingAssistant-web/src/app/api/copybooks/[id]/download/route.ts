import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get copybook record with ownership verification
  const { data: copybook, error } = await supabase
    .from('copybooks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !copybook) {
    return Response.json({ error: 'Copybook not found' }, { status: 404 });
  }

  if (!copybook.pdf_storage_path) {
    return Response.json({ error: 'PDF not available' }, { status: 404 });
  }

  // Fetch PDF from storage
  const { data: pdfData, error: downloadError } = await supabase.storage
    .from('copybook-pdfs')
    .download(copybook.pdf_storage_path);

  if (downloadError || !pdfData) {
    return Response.json({ error: 'Failed to download PDF' }, { status: 500 });
  }

  // Use stored filename or generate a default one
  const fileName = copybook.download_file_name || `字帖 ${copybook.created_at}.pdf`;

  // Convert blob to array buffer
  const arrayBuffer = await pdfData.arrayBuffer();

  // Return PDF with proper Content-Disposition header
  return new Response(arrayBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
