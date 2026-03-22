export interface ErrorAnnotation {
  start: number;
  end: number;
  original: string;
  corrected: string;
  error_type: string;
  explanation: string;
  severity: 'minor' | 'major' | 'critical';
}

export interface Highlight {
  text: string;
  type: 'vocabulary' | 'phrase' | 'sentence';
  reason: string;
}

export interface ErrorSummaryItem {
  error_type: string;
  error_type_label: string;
  count: number;
}

export interface CorrectionScores {
  content: number;
  communication: number;
  language: number;
  total: number;
}

export interface CorrectionResult {
  scores: CorrectionScores;
  overall_comment: string;
  improvement_suggestions: string;
  error_annotations: ErrorAnnotation[];
  highlights: Highlight[];
  error_summary: ErrorSummaryItem[];
}
