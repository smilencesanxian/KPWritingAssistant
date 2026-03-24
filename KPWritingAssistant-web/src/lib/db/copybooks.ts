import { createClient } from '@/lib/supabase/server';
import type { Copybook } from '@/types/database';

export type CopybookWithCorrectionId = Copybook & {
  model_essays: { correction_id: string } | null;
};

export async function createCopybook(
  userId: string,
  modelEssayId: string,
  pdfStoragePath: string,
  pdfUrl: string,
  fontStyle: string,
  templateId: string,
  mode: string,
  downloadFileName?: string
): Promise<Copybook> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('copybooks')
    .insert({
      user_id: userId,
      model_essay_id: modelEssayId,
      pdf_storage_path: pdfStoragePath,
      pdf_url: pdfUrl,
      font_style: fontStyle,
      template_id: templateId,
      mode,
      download_file_name: downloadFileName || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create copybook: ${error.message}`);
  }

  return data as Copybook;
}

export async function getCopybookById(id: string, userId: string): Promise<CopybookWithCorrectionId | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('copybooks')
    .select('*, model_essays(correction_id)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get copybook: ${error.message}`);
  }

  return data as CopybookWithCorrectionId;
}

export async function getCopybookByModelEssayId(
  modelEssayId: string,
  userId: string,
  templateId: string,
  mode: string,
  fontStyle: string
): Promise<Copybook | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('copybooks')
    .select('*')
    .eq('model_essay_id', modelEssayId)
    .eq('user_id', userId)
    .eq('template_id', templateId)
    .eq('mode', mode)
    .eq('font_style', fontStyle)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get copybook: ${error.message}`);
  }

  return data as Copybook;
}
