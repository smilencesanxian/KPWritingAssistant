export interface Submission {
  id: string;
  user_id: string;
  original_image_path: string | null;
  ocr_text: string | null;
  title: string | null;
  status: string;
  created_at: string;
  // v1.2.0 新增字段
  exam_part: 'part1' | 'part2' | null;
  question_type: 'q1' | 'q2' | null;
  question_image_path: string | null;
  question_ocr_text: string | null;
  essay_topic: string | null;
}

export interface Correction {
  id: string;
  submission_id: string;
  content_score: number | null;
  communication_score: number | null;
  organization_score: number | null;
  language_score: number | null;
  total_score: number | null;
  error_annotations: import('./ai').ErrorAnnotation[];
  overall_comment: string | null;
  improvement_suggestions: string | null;
  status: string;
  created_at: string;
  // v1.2.1 新增字段：结构化批改数据
  scoring_comments?: {
    content: { score: number; comment: string };
    communication: { score: number; comment: string };
    organisation: { score: number; comment: string };
    language: { score: number; comment: string };
  } | null;
  correction_steps?: {
    step1: string;
    step2: string;
    step3: string;
    step4: Array<{
      original: string;
      error_type: string;
      suggestion: string;
    }>;
    step5: string;
    step6: string;
  } | null;
  structured_suggestions?: Array<{
    icon: string;
    title: string;
    detail: string;
  }> | null;
}

export interface EditHistoryItem {
  timestamp: string;
  original: string;
  edited: string;
  note?: string;
}

export interface ModelEssaySourceSpan {
  start: number;
  end: number;
  text: string;
  source_type: 'historical_highlight' | 'knowledge_base';
  source_id: string | null;
  occurrence_index: number;
}

export interface ModelEssay {
  id: string;
  correction_id: string;
  target_level: 'pass' | 'good' | 'excellent';
  content: string;
  created_at: string;
  // v1.2.0 新增字段
  user_edited_content: string | null;
  is_user_edited: boolean;
  edit_history: EditHistoryItem[] | null;
  user_preference_notes: string | null;
  source_spans: ModelEssaySourceSpan[] | null;
}

export interface Highlight {
  id: string;
  user_id: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  source_submission_id: string | null;
  created_at: string;
  // v1.2.0 新增字段
  source: 'user' | 'system';
  recommended_phrase_id: string | null;
  // v1.2.1 新增字段
  knowledge_essay_type: string | null;
  // v1.2.3 新增字段
  usage_count: number;
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
  download_file_name: string | null;
  created_at: string;
}

// v1.2.0 新增：推荐句式
export interface RecommendedPhrase {
  id: string;
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  essay_type: 'email' | 'article' | 'story' | 'general' | null;
  topic_tags: string[] | null;
  usage_example: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  // v1.2.1 新增字段
  category: string | null;
  level: 'basic' | 'advanced' | null;
}

// v1.2.0 新增：写作导览节点
export interface WritingGuideNode {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  node_type: 'essay_type' | 'topic' | 'highlight';
  label: string;
  highlight_id: string | null;
  source: 'user' | 'system';
  sort_order: number;
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
