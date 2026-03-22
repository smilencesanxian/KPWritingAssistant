export interface Submission {
  id: string;
  user_id: string;
  original_image_path: string | null;
  ocr_text: string | null;
  title: string | null;
  status: string;
  created_at: string;
}

export interface Correction {
  id: string;
  submission_id: string;
  content_score: number | null;
  communication_score: number | null;
  language_score: number | null;
  total_score: number | null;
  error_annotations: import('./ai').ErrorAnnotation[];
  overall_comment: string | null;
  improvement_suggestions: string | null;
  status: string;
  created_at: string;
}

export interface ModelEssay {
  id: string;
  correction_id: string;
  target_level: 'pass' | 'good' | 'excellent';
  content: string;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  source_submission_id: string | null;
  created_at: string;
}

export interface ErrorPoint {
  id: string;
  user_id: string;
  error_type: string;
  error_type_label: string;
  occurrence_count: number;
  is_flagged: boolean;
  first_seen_at: string;
  last_seen_at: string;
}

export interface ErrorInstance {
  id: string;
  error_point_id: string;
  submission_id: string;
  original_sentence: string | null;
  corrected_sentence: string | null;
  explanation: string | null;
  created_at: string;
}

export interface Copybook {
  id: string;
  user_id: string;
  model_essay_id: string;
  font_style: string;
  template_id: string;
  mode: string;
  pdf_storage_path: string | null;
  pdf_url: string | null;
  created_at: string;
}

export interface SubmissionDetail extends Submission {
  correction: (Correction & { model_essays: ModelEssay[] }) | null;
}

export interface ErrorPointDetail extends ErrorPoint {
  instances: ErrorInstance[];
}

export interface UserStats {
  corrections_count: number;
  highlights_count: number;
  error_points_count: number;
  flagged_error_count: number;
}
