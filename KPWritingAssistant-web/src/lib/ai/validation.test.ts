import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

/**
 * Task 24: AI Correction New Format Validation Tests
 *
 * Tests for the new structured JSON output format:
 * - scoring_overview with 4 dimensions
 * - correction_steps with 6 steps
 * - improvement_suggestions as structured array
 * - highlights with type classification
 * - model_essay field
 */

// Define Zod schema for new CorrectionResult format
const scoringDimensionSchema = z.object({
  score: z.number().min(0).max(5),
  comment: z.string(),
});

const correctionStep4ItemSchema = z.object({
  original: z.string(),
  error_type: z.string(),
  suggestion: z.string(),
});

const improvementSuggestionSchema = z.object({
  icon: z.string(),
  title: z.string(),
  detail: z.string(),
});

const highlightSchema = z.object({
  text: z.string(),
  type: z.enum(['vocabulary', 'phrase', 'sentence']),
  reason: z.string(),
});

const correctionResultSchema = z.object({
  scoring_overview: z.object({
    content: scoringDimensionSchema,
    communication: scoringDimensionSchema,
    organisation: scoringDimensionSchema,
    language: scoringDimensionSchema,
  }),
  correction_steps: z.object({
    step1: z.string(),
    step2: z.string(),
    step3: z.string(),
    step4: z.array(correctionStep4ItemSchema),
    step5: z.string(),
    step6: z.string(),
  }),
  improvement_suggestions: z.array(improvementSuggestionSchema),
  highlights: z.array(highlightSchema),
  model_essay: z.string(),
});

describe('UT-005 ~ UT-009: New CorrectionResult Format Validation', () => {
  describe('UT-005: Complete valid new format JSON', () => {
    it('should validate a complete new format response', () => {
      const validResponse = {
        scoring_overview: {
          content: { score: 4, comment: '内容完整，覆盖了所有要点' },
          communication: { score: 3, comment: '邮件格式正确，语气自然' },
          organisation: { score: 4, comment: '结构清晰，分段合理' },
          language: { score: 3, comment: '词汇较丰富，有少量语法错误' },
        },
        correction_steps: {
          step1: '内容审查：学生完整回答了题目中的三个问题，每个问题都有具体细节支撑。',
          step2: '交际效果：邮件格式规范，称呼和结尾恰当，语气友好自然。',
          step3: '组织结构：采用三段式结构，逻辑连贯，使用了because、so等连接词。',
          step4: [
            { original: 'I very like', error_type: 'word_choice', suggestion: 'I like very much' },
            { original: 'He go to', error_type: 'tense', suggestion: 'He goes to' },
          ],
          step5: '亮点分析：使用了"look forward to"等固定搭配，词汇运用准确。',
          step6: '总评：整体表现良好，建议加强语法准确性，多使用复合句。',
        },
        improvement_suggestions: [
          { icon: '✏️', title: '语法准确性', detail: '注意第三人称单数动词变化' },
          { icon: '📚', title: '词汇丰富度', detail: '尝试使用更多形容词描述感受' },
        ],
        highlights: [
          { text: 'look forward to', type: 'phrase', reason: '准确使用固定搭配' },
          { text: 'I would like to', type: 'sentence', reason: '礼貌表达建议' },
        ],
        model_essay: 'Dear friend,\\n\\nThank you for your email...',
      };

      const result = correctionResultSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should accept empty arrays for optional fields', () => {
      const responseWithEmptyArrays = {
        scoring_overview: {
          content: { score: 5, comment: 'Excellent' },
          communication: { score: 5, comment: 'Excellent' },
          organisation: { score: 5, comment: 'Excellent' },
          language: { score: 5, comment: 'Excellent' },
        },
        correction_steps: {
          step1: '内容完整',
          step2: '交际得体',
          step3: '结构清晰',
          step4: [],
          step5: '无明显亮点',
          step6: '表现优秀',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'Sample essay text',
      };

      const result = correctionResultSchema.safeParse(responseWithEmptyArrays);
      expect(result.success).toBe(true);
    });
  });

  describe('UT-006: Missing required top-level fields', () => {
    it('should fail when scoring_overview is missing', () => {
      const invalidResponse = {
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('scoring_overview'))).toBe(true);
      }
    });

    it('should fail when correction_steps is missing', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when model_essay is missing', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('UT-007: step4 array item format validation', () => {
    it('should fail when step4 item is missing original', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [{ error_type: 'tense', suggestion: 'fix' }],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when step4 item is missing error_type', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [{ original: 'error', suggestion: 'fix' }],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when step4 item is missing suggestion', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [{ original: 'error', error_type: 'tense' }],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('UT-008: improvement_suggestions format validation', () => {
    it('should fail when suggestion is missing icon', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [{ title: 'Grammar', detail: 'Fix it' }],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when suggestion is missing title', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [{ icon: '✏️', detail: 'Fix it' }],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when suggestion is missing detail', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [{ icon: '✏️', title: 'Grammar' }],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('UT-009: Field type validation', () => {
    it('should fail when score is a string instead of number', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: '4', comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when score is out of range (greater than 5)', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 6, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when score is negative', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: -1, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail when highlight type is invalid', () => {
      const invalidResponse = {
        scoring_overview: {
          content: { score: 4, comment: 'test' },
          communication: { score: 4, comment: 'test' },
          organisation: { score: 4, comment: 'test' },
          language: { score: 4, comment: 'test' },
        },
        correction_steps: {
          step1: 'test',
          step2: 'test',
          step3: 'test',
          step4: [],
          step5: 'test',
          step6: 'test',
        },
        improvement_suggestions: [],
        highlights: [{ text: 'test', type: 'invalid', reason: 'test' }],
        model_essay: 'test',
      };

      const result = correctionResultSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});

describe('Edge Cases and Boundary Tests', () => {
  it('should handle very long comments', () => {
    const longComment = 'a'.repeat(1000);
    const response = {
      scoring_overview: {
        content: { score: 4, comment: longComment },
        communication: { score: 4, comment: 'test' },
        organisation: { score: 4, comment: 'test' },
        language: { score: 4, comment: 'test' },
      },
      correction_steps: {
        step1: 'test',
        step2: 'test',
        step3: 'test',
        step4: [],
        step5: 'test',
        step6: 'test',
      },
      improvement_suggestions: [],
      highlights: [],
      model_essay: 'test',
    };

    const result = correctionResultSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should handle special characters in strings', () => {
    const response = {
      scoring_overview: {
        content: { score: 4, comment: 'Contains "quotes" and \\ backslash' },
        communication: { score: 4, comment: 'test' },
        organisation: { score: 4, comment: 'test' },
        language: { score: 4, comment: 'test' },
        },
      correction_steps: {
        step1: 'Line 1\\nLine 2',
        step2: 'test',
        step3: 'test',
        step4: [],
        step5: 'test',
        step6: 'test',
      },
      improvement_suggestions: [
        { icon: '🎯', title: 'Test "quoted"', detail: 'Detail with \\ backslash' },
      ],
      highlights: [],
      model_essay: 'Essay with \\n newlines',
    };

    const result = correctionResultSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should handle large step4 arrays', () => {
    const step4Items = Array.from({ length: 100 }, (_, i) => ({
      original: `error ${i}`,
      error_type: 'tense',
      suggestion: `fix ${i}`,
    }));

    const response = {
      scoring_overview: {
        content: { score: 4, comment: 'test' },
        communication: { score: 4, comment: 'test' },
        organisation: { score: 4, comment: 'test' },
        language: { score: 4, comment: 'test' },
      },
      correction_steps: {
        step1: 'test',
        step2: 'test',
        step3: 'test',
        step4: step4Items,
        step5: 'test',
        step6: 'test',
      },
      improvement_suggestions: [],
      highlights: [],
      model_essay: 'test',
    };

    const result = correctionResultSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should handle unicode emoji in icon field', () => {
    const response = {
      scoring_overview: {
        content: { score: 4, comment: 'test' },
        communication: { score: 4, comment: 'test' },
        organisation: { score: 4, comment: 'test' },
        language: { score: 4, comment: 'test' },
      },
      correction_steps: {
        step1: 'test',
        step2: 'test',
        step3: 'test',
        step4: [],
        step5: 'test',
        step6: 'test',
      },
      improvement_suggestions: [
        { icon: '🎉🎯✨', title: 'Celebration', detail: 'Great job!' },
      ],
      highlights: [],
      model_essay: 'test',
    };

    const result = correctionResultSchema.safeParse(response);
    expect(result.success).toBe(true);
  });
});
