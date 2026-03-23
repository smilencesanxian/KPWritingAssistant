import { createClient } from '@/lib/supabase/server';
import type { Correction, ModelEssay } from '@/types/database';
import type { ErrorAnnotation } from '@/types/ai';

export interface CreateCorrectionInput {
  content_score: number;
  communication_score: number;
  organization_score: number;
  language_score: number;
  total_score: number;
  error_annotations: ErrorAnnotation[];
  overall_comment: string;
  improvement_suggestions: string;
}

export async function createCorrection(
  submissionId: string,
  data: CreateCorrectionInput
): Promise<Correction> {
  const supabase = await createClient();

  const { data: correction, error } = await supabase
    .from('corrections')
    .insert({
      submission_id: submissionId,
      content_score: data.content_score,
      communication_score: data.communication_score,
      organization_score: data.organization_score,
      language_score: data.language_score,
      total_score: data.total_score,
      error_annotations: data.error_annotations,
      overall_comment: data.overall_comment,
      improvement_suggestions: data.improvement_suggestions,
      status: 'completed',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create correction: ${error.message}`);
  }

  return correction as Correction;
}

export async function getCorrectionById(id: string): Promise<Correction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('corrections')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to get correction: ${error.message}`);
  }

  return data as Correction;
}

export async function getCorrectionBySubmissionId(
  submissionId: string
): Promise<Correction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('corrections')
    .select('*')
    .eq('submission_id', submissionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get correction: ${error.message}`);
  }

  return data as Correction;
}

export async function updateCorrectionStatus(
  id: string,
  status: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('corrections')
    .update({ status })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update correction status: ${error.message}`);
  }
}

export async function createModelEssay(
  correctionId: string,
  level: string,
  content: string
): Promise<ModelEssay> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('model_essays')
    .insert({
      correction_id: correctionId,
      target_level: level,
      content,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create model essay: ${error.message}`);
  }

  return data as ModelEssay;
}

export async function getModelEssaysByCorrectionId(
  correctionId: string
): Promise<ModelEssay[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('model_essays')
    .select('*')
    .eq('correction_id', correctionId);

  if (error) {
    throw new Error(`Failed to get model essays: ${error.message}`);
  }

  return (data ?? []) as ModelEssay[];
}

export async function getModelEssayByLevel(
  correctionId: string,
  level: string
): Promise<ModelEssay | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('model_essays')
    .select('*')
    .eq('correction_id', correctionId)
    .eq('target_level', level)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get model essay: ${error.message}`);
  }

  return data as ModelEssay;
}
