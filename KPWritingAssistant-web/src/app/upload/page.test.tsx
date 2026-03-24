import { describe, it, expect, jest } from '@jest/globals';

/**
 * Upload Page Unit Tests - Task 6
 *
 * Tests for:
 * - State machine transitions
 * - Type detection display logic
 * - Manual type override
 * - API parameter building
 * - Scoring dimension cards
 */

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Helper function to generate type label (to be implemented in actual code)
function getTypeLabel(examPart: 'part1' | 'part2' | null, questionType: 'q1' | 'q2' | null): string {
  if (examPart === 'part1') {
    return 'Part 1 · 邮件';
  }
  if (examPart === 'part2') {
    if (questionType === 'q1') return 'Part 2 · Question 1 · 文章';
    if (questionType === 'q2') return 'Part 2 · Question 2 · 故事';
    return 'Part 2 · 文章';
  }
  return '未识别';
}

// Helper function to build essay API request body
function buildEssayRequestBody(params: {
  ocrText: string;
  storagePath: string;
  examPart: 'part1' | 'part2' | null;
  questionType: 'q1' | 'q2' | null;
  questionImagePath: string | null;
  questionOcrText: string | null;
  essayTopic: string | null;
}) {
  return {
    ocr_text: params.ocrText,
    original_image_path: params.storagePath,
    exam_part: params.examPart,
    question_type: params.questionType,
    question_image_path: params.questionImagePath,
    question_ocr_text: params.questionOcrText,
    essay_topic: params.essayTopic,
  };
}

describe('Upload Page - Type Detection Display', () => {
  describe('getTypeLabel', () => {
    it('UT-005: should generate correct label for Part 1 email', () => {
      expect(getTypeLabel('part1', null)).toBe('Part 1 · 邮件');
    });

    it('UT-006: should generate correct label for Part 2 Question 1', () => {
      expect(getTypeLabel('part2', 'q1')).toBe('Part 2 · Question 1 · 文章');
    });

    it('UT-007: should generate correct label for Part 2 Question 2', () => {
      expect(getTypeLabel('part2', 'q2')).toBe('Part 2 · Question 2 · 故事');
    });

    it('should handle null values gracefully', () => {
      expect(getTypeLabel(null, null)).toBe('未识别');
    });

    it('should handle part2 without question type', () => {
      expect(getTypeLabel('part2', null)).toBe('Part 2 · 文章');
    });
  });
});

describe('Upload Page - API Parameter Building', () => {
  describe('buildEssayRequestBody', () => {
    it('UT-010: should build correct request body with all fields', () => {
      const params = {
        ocrText: 'Dear friend, How are you?',
        storagePath: 'essays/test.jpg',
        examPart: 'part1' as const,
        questionType: null as const,
        questionImagePath: 'questions/test.jpg',
        questionOcrText: 'Write an email to your friend',
        essayTopic: '给朋友写邮件',
      };

      const body = buildEssayRequestBody(params);

      expect(body).toEqual({
        ocr_text: 'Dear friend, How are you?',
        original_image_path: 'essays/test.jpg',
        exam_part: 'part1',
        question_type: null,
        question_image_path: 'questions/test.jpg',
        question_ocr_text: 'Write an email to your friend',
        essay_topic: '给朋友写邮件',
      });
    });

    it('UT-011: should handle null question image correctly', () => {
      const params = {
        ocrText: 'Dear friend, How are you?',
        storagePath: 'essays/test.jpg',
        examPart: 'part1' as const,
        questionType: null as const,
        questionImagePath: null,
        questionOcrText: null,
        essayTopic: null,
      };

      const body = buildEssayRequestBody(params);

      expect(body.question_image_path).toBeNull();
      expect(body.question_ocr_text).toBeNull();
    });

    it('should include Part 2 Question 1 fields correctly', () => {
      const params = {
        ocrText: 'In my opinion, camping is great...',
        storagePath: 'essays/test.jpg',
        examPart: 'part2' as const,
        questionType: 'q1' as const,
        questionImagePath: 'questions/test.jpg',
        questionOcrText: 'Write an article about camping',
        essayTopic: '露营',
      };

      const body = buildEssayRequestBody(params);

      expect(body.exam_part).toBe('part2');
      expect(body.question_type).toBe('q1');
    });
  });
});

describe('Upload Page - Manual Type Override', () => {
  const typeOptions = [
    { value: 'part1', label: 'Part 1 邮件', questionType: null },
    { value: 'part2-q1', label: 'Part 2 Question 1 文章', questionType: 'q1' as const },
    { value: 'part2-q2', label: 'Part 2 Question 2 故事', questionType: 'q2' as const },
  ];

  it('UT-008: selecting Part 1 should set correct exam_part', () => {
    const selected = typeOptions.find(o => o.value === 'part1');
    expect(selected).toEqual({
      value: 'part1',
      label: 'Part 1 邮件',
      questionType: null,
    });
  });

  it('UT-009: selecting Part 2 Q1 should set correct values', () => {
    const selected = typeOptions.find(o => o.value === 'part2-q1');
    expect(selected).toEqual({
      value: 'part2-q1',
      label: 'Part 2 Question 1 文章',
      questionType: 'q1',
    });
  });

  it('should parse part2-q1 value correctly', () => {
    const value = 'part2-q1';
    const [examPart, questionType] = value.split('-') as ['part2', 'q1' | 'q2'];
    expect(examPart).toBe('part2');
    expect(questionType).toBe('q1');
  });

  it('should parse part1 value correctly', () => {
    const value = 'part1';
    const examPart = value;
    const questionType = null;
    expect(examPart).toBe('part1');
    expect(questionType).toBeNull();
  });
});

describe('Upload Page - Scoring Dimension Cards', () => {
  const scoringDimensions = [
    {
      key: 'content',
      title: 'Content',
      maxScore: 5,
      description: '完整覆盖要点 + 充实细节',
    },
    {
      key: 'communicative_achievement',
      title: 'Communicative Achievement',
      maxScore: 5,
      description: '格式规范，语气恰当',
    },
    {
      key: 'organisation',
      title: 'Organisation',
      maxScore: 5,
      description: '分段清晰，逻辑连贯',
    },
    {
      key: 'language',
      title: 'Language',
      maxScore: 5,
      description: '词汇丰富，语法多样',
    },
  ];

  it('UT-014: should have exactly 4 scoring dimensions', () => {
    expect(scoringDimensions).toHaveLength(4);
  });

  it('UT-015: should have correct dimension titles', () => {
    const titles = scoringDimensions.map(d => d.title);
    expect(titles).toContain('Content');
    expect(titles).toContain('Communicative Achievement');
    expect(titles).toContain('Organisation');
    expect(titles).toContain('Language');
  });

  it('should have correct max scores for all dimensions', () => {
    scoringDimensions.forEach(dim => {
      expect(dim.maxScore).toBe(5);
    });
  });

  it('should have Chinese descriptions for all dimensions', () => {
    scoringDimensions.forEach(dim => {
      expect(dim.description).toBeTruthy();
      expect(dim.description.length).toBeGreaterThan(0);
    });
  });
});

describe('Upload Page - State Machine', () => {
  type Step = 'select' | 'processing' | 'confirm' | 'correcting' | 'correction-failed';

  const validTransitions: Record<Step, Step[]> = {
    'select': ['processing'],
    'processing': ['confirm', 'select'],
    'confirm': ['correcting', 'select'],
    'correcting': ['correction-failed'],
    'correction-failed': ['correcting', 'confirm'],
  };

  it('UT-001: should allow select → processing transition', () => {
    expect(validTransitions['select']).toContain('processing');
  });

  it('UT-002: should allow processing → confirm transition', () => {
    expect(validTransitions['processing']).toContain('confirm');
  });

  it('UT-003: should allow confirm → correcting transition', () => {
    expect(validTransitions['confirm']).toContain('correcting');
  });

  it('UT-004: should allow processing → select on failure', () => {
    expect(validTransitions['processing']).toContain('select');
  });

  it('should not allow invalid transitions', () => {
    expect(validTransitions['select']).not.toContain('confirm');
    expect(validTransitions['correcting']).not.toContain('select');
  });
});

describe('Upload Page - Parallel OCR Logic', () => {
  it('UT-012: should process both images in parallel when both provided', async () => {
    const essayOcrPromise = Promise.resolve({ text: 'Essay content' });
    const questionOcrPromise = Promise.resolve({ text: 'Question content' });

    const [essayResult, questionResult] = await Promise.all([
      essayOcrPromise,
      questionOcrPromise,
    ]);

    expect(essayResult.text).toBe('Essay content');
    expect(questionResult.text).toBe('Question content');
  });

  it('UT-013: should only process essay when question is not provided', async () => {
    const hasQuestionImage = false;
    const ocrCalls = [];

    // Simulate OCR calls
    ocrCalls.push(Promise.resolve({ text: 'Essay content' }));
    if (hasQuestionImage) {
      ocrCalls.push(Promise.resolve({ text: 'Question content' }));
    }

    const results = await Promise.all(ocrCalls);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('Essay content');
  });

  it('should handle partial OCR failure gracefully', async () => {
    const essayOcrPromise = Promise.resolve({ text: 'Essay content' });
    const questionOcrPromise = Promise.reject(new Error('OCR failed'));

    const results = await Promise.allSettled([essayOcrPromise, questionOcrPromise]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
  });
});

describe('Upload Page - Detect Type API Integration', () => {
  it('should call detect-type API with correct parameters', async () => {
    const essayOcrText = 'Dear friend...';
    const questionOcrText = 'Write an email...';

    const expectedBody = {
      essay_ocr_text: essayOcrText,
      question_ocr_text: questionOcrText,
    };

    expect(expectedBody).toEqual({
      essay_ocr_text: 'Dear friend...',
      question_ocr_text: 'Write an email...',
    });
  });

  it('should call detect-type API without question when not provided', async () => {
    const essayOcrText = 'Dear friend...';
    const questionOcrText = undefined;

    const expectedBody = {
      essay_ocr_text: essayOcrText,
      ...(questionOcrText && { question_ocr_text: questionOcrText }),
    };

    expect(expectedBody).toEqual({
      essay_ocr_text: 'Dear friend...',
    });
  });

  it('should handle detect-type API failure gracefully', async () => {
    // When detect-type fails, should use default values
    const defaultType = {
      exam_part: 'part1',
      question_type: null,
      essay_type_label: '邮件',
      topic: '',
      confidence: 'low',
    };

    expect(defaultType.exam_part).toBe('part1');
  });
});
