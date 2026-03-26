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

// Legacy: kept for backward compatibility
export interface CorrectionScores {
  content: number;
  communication: number;
  organization: number;
  language: number;
  total: number;
}

// New structured scoring overview (v1.2.1)
export interface ScoringOverview {
  content: { score: number; comment: string };
  communication: { score: number; comment: string };
  organisation: { score: number; comment: string };
  language: { score: number; comment: string };
}

// New structured correction steps (v1.2.1)
export interface Step4ErrorItem {
  original: string;
  error_type: string;
  suggestion: string;
}

export interface CorrectionSteps {
  step1: string;
  step2: string;
  step3: string;
  step4: Step4ErrorItem[];
  step5: string;
  step6: string;
}

// New structured improvement suggestion (v1.2.1)
export interface StructuredSuggestion {
  icon: string;
  title: string;
  detail: string;
}

// Legacy correction result (v1.2.0 and earlier)
export interface LegacyCorrectionResult {
  scores: CorrectionScores;
  overall_comment: string;
  improvement_suggestions: string;
  error_annotations: ErrorAnnotation[];
  highlights: Highlight[];
  error_summary: ErrorSummaryItem[];
}

// New structured correction result (v1.2.1+)
export interface StructuredCorrectionResult {
  scoring_overview: ScoringOverview;
  correction_steps: CorrectionSteps;
  improvement_suggestions: StructuredSuggestion[];
  highlights: Highlight[];
  model_essay: string;
}

// Combined type for parsing flexibility
type CorrectionResultBase = {
  // New structured fields (v1.2.1)
  scoring_overview?: ScoringOverview;
  correction_steps?: CorrectionSteps;
  // Legacy fields (v1.2.0)
  scores?: CorrectionScores;
  overall_comment?: string;
  error_annotations?: ErrorAnnotation[];
  error_summary?: ErrorSummaryItem[];
  // highlights is common to both
  highlights: Highlight[];
  // model_essay is new format
  model_essay?: string;
};

// improvement_suggestions can be either string (legacy) or array (new)
export type CorrectionResult = CorrectionResultBase & {
  improvement_suggestions?: string | StructuredSuggestion[];
};

export interface DetectTypeResult {
  exam_part: 'part1' | 'part2';
  question_type: 'q1' | 'q2' | null;
  essay_type_label: string;
  topic: string;
  confidence: 'high' | 'medium' | 'low';
}
