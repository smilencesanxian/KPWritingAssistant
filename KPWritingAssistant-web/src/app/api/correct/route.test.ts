/**
 * @jest-environment node
 */

import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { getSubmissionById, updateSubmissionStatus } from '@/lib/db/essays';
import { createCorrection } from '@/lib/db/corrections';
import { correctEssay } from '@/lib/ai/llm';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/db/essays');
jest.mock('@/lib/db/corrections');
jest.mock('@/lib/ai/llm');
jest.mock('@/lib/db/writing-guide', () => ({
  syncWritingGuideFromCorrection: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/db/highlights', () => ({
  createHighlights: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/db/error-points', () => ({
  processErrorsFromCorrection: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn().mockReturnValue(true),
}));

describe('POST /api/correct', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
  });

  it('IT-001: should process new format AI response and save structured fields', async () => {
    const submissionId = 'sub-123';
    const mockSubmission = {
      id: submissionId,
      user_id: mockUser.id,
      ocr_text: 'Test essay content',
      status: 'pending',
      exam_part: 'part1',
      question_type: null,
    };

    const mockAIResult = {
      scoring_overview: {
        content: { score: 4, comment: '内容完整' },
        communication: { score: 4, comment: '语气恰当' },
        organisation: { score: 3, comment: '过渡可改进' },
        language: { score: 4, comment: '词汇丰富' },
      },
      scores: {
        content: 4,
        communication: 4,
        organization: 3,
        language: 4,
        total: 15,
      },
      correction_steps: {
        step1: 'step1 content',
        step2: 'step2 content',
        step3: 'step3 content',
        step4: [{ original: 'error', error_type: 'grammar', suggestion: 'fix' }],
        step5: 'step5 content',
        step6: 'step6 content',
      },
      improvement_suggestions: [
        { icon: '📝', title: '词汇', detail: '建议详情' },
      ],
      highlights: [],
      error_annotations: [],
      error_summary: [],
      overall_comment: '总体评语',
    };

    const mockCorrection = {
      id: 'corr-123',
      submission_id: submissionId,
      content_score: 4,
      communication_score: 4,
      organization_score: 3,
      language_score: 4,
      total_score: 15,
      scoring_comments: mockAIResult.scoring_overview,
      correction_steps: mockAIResult.correction_steps,
      structured_suggestions: mockAIResult.improvement_suggestions,
      status: 'completed',
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);
    (correctEssay as jest.Mock).mockResolvedValue(mockAIResult);
    (createCorrection as jest.Mock).mockResolvedValue(mockCorrection);
    (updateSubmissionStatus as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: submissionId }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.correction).toBeDefined();
    expect(createCorrection).toHaveBeenCalledWith(
      submissionId,
      expect.objectContaining({
        scoring_comments: mockAIResult.scoring_overview,
        correction_steps: mockAIResult.correction_steps,
        structured_suggestions: mockAIResult.improvement_suggestions,
      })
    );
    expect(correctEssay).toHaveBeenCalledWith('Test essay content', 'part1', null);
  });

  it('IT-002: should be backward compatible with old format AI response', async () => {
    const submissionId = 'sub-123';
    const mockSubmission = {
      id: submissionId,
      user_id: mockUser.id,
      ocr_text: 'Test essay content',
      status: 'pending',
      question_type: null,
    };

    const mockAIResult = {
      scores: {
        content: 4,
        communication: 4,
        organization: 3,
        language: 4,
        total: 15,
      },
      overall_comment: '总体评语',
      improvement_suggestions: '改进建议文本',
      error_annotations: [],
      highlights: [],
      error_summary: [],
    };

    const mockCorrection = {
      id: 'corr-123',
      submission_id: submissionId,
      content_score: 4,
      communication_score: 4,
      organization_score: 3,
      language_score: 4,
      total_score: 15,
      scoring_comments: null,
      correction_steps: null,
      structured_suggestions: null,
      status: 'completed',
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);
    (correctEssay as jest.Mock).mockResolvedValue(mockAIResult);
    (createCorrection as jest.Mock).mockResolvedValue(mockCorrection);
    (updateSubmissionStatus as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: submissionId }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.correction).toBeDefined();
    expect(result.correction.scoring_comments).toBeNull();
    expect(result.correction.correction_steps).toBeNull();
    expect(result.correction.structured_suggestions).toBeNull();
  });

  it('IT-003: should persist structured data to database', async () => {
    const submissionId = 'sub-123';
    const mockSubmission = {
      id: submissionId,
      user_id: mockUser.id,
      ocr_text: 'Test essay content',
      status: 'pending',
      exam_part: 'part2',
      question_type: 'q2',
    };

    const mockAIResult = {
      scoring_overview: {
        content: { score: 5, comment: '内容优秀' },
        communication: { score: 5, comment: '沟通优秀' },
        organisation: { score: 5, comment: '组织优秀' },
        language: { score: 5, comment: '语言优秀' },
      },
      scores: {
        content: 5,
        communication: 5,
        organization: 5,
        language: 5,
        total: 20,
      },
      correction_steps: {
        step1: '这是一篇Part2作文',
        step2: '总体评价',
        step3: '主要问题',
        step4: [],
        step5: '修改后全文',
        step6: '总体评语',
      },
      improvement_suggestions: [
        { icon: '✨', title: '亮点', detail: '继续保持' },
      ],
      highlights: [],
      error_annotations: [],
      error_summary: [],
      overall_comment: '总体评语',
    };

    const mockCorrection = {
      id: 'corr-456',
      submission_id: submissionId,
      content_score: 5,
      communication_score: 5,
      organization_score: 5,
      language_score: 5,
      total_score: 20,
      scoring_comments: mockAIResult.scoring_overview,
      correction_steps: mockAIResult.correction_steps,
      structured_suggestions: mockAIResult.improvement_suggestions,
      status: 'completed',
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);
    (correctEssay as jest.Mock).mockResolvedValue(mockAIResult);
    (createCorrection as jest.Mock).mockResolvedValue(mockCorrection);
    (updateSubmissionStatus as jest.Mock).mockResolvedValue(undefined);

    const request = new Request('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: submissionId }),
    });

    await POST(request as unknown as Request);

    // Verify createCorrection was called with structured fields
    const createCorrectionCall = (createCorrection as jest.Mock).mock.calls[0];
    expect(createCorrectionCall[1]).toMatchObject({
      scoring_comments: mockAIResult.scoring_overview,
      correction_steps: mockAIResult.correction_steps,
      structured_suggestions: mockAIResult.improvement_suggestions,
    });
    expect(correctEssay).toHaveBeenCalledWith('Test essay content', 'part2', 'q2');
  });

  it('IT-004: should return existing correction for already completed submission (idempotent)', async () => {
    const submissionId = 'sub-123';
    const existingCorrection = {
      id: 'corr-existing',
      submission_id: submissionId,
      content_score: 4,
      communication_score: 4,
      organization_score: 3,
      language_score: 4,
      total_score: 15,
      scoring_comments: { content: { score: 4, comment: '内容' } },
      status: 'completed',
    };

    const mockSubmission = {
      id: submissionId,
      user_id: mockUser.id,
      ocr_text: 'Test essay content',
      status: 'completed',
      correction: existingCorrection,
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: submissionId }),
    });

    const response = await POST(request);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.correction).toEqual(existingCorrection);
    expect(correctEssay).not.toHaveBeenCalled();
    expect(createCorrection).not.toHaveBeenCalled();
  });

  it('should return 401 for unauthorized user', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'sub-123' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should return 400 for missing submission_id', async () => {
    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 403 for non-existent submission', async () => {
    (getSubmissionById as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'non-existent' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  it('should return 400 for empty essay content', async () => {
    const mockSubmission = {
      id: 'sub-123',
      user_id: mockUser.id,
      ocr_text: null,
      status: 'pending',
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'sub-123' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should return 500 when AI correction fails', async () => {
    const mockSubmission = {
      id: 'sub-123',
      user_id: mockUser.id,
      ocr_text: 'Test essay content',
      status: 'pending',
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(mockSubmission);
    (correctEssay as jest.Mock).mockRejectedValue(new Error('AI service error'));
    (updateSubmissionStatus as jest.Mock).mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/correct', {
      method: 'POST',
      body: JSON.stringify({ submission_id: 'sub-123' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
