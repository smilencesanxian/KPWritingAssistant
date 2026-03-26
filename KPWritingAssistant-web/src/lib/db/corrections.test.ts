import {
  createCorrection,
  getCorrectionById,
  getCorrectionBySubmissionId,
} from './corrections';
import { createClient } from '@/lib/supabase/server';
import type { Correction } from '@/types/database';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

describe('corrections DB layer', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('createCorrection', () => {
    const mockCorrection: Correction = {
      id: 'corr-123',
      submission_id: 'sub-123',
      content_score: 4,
      communication_score: 4,
      organization_score: 3,
      language_score: 4,
      total_score: 15,
      error_annotations: [],
      overall_comment: '总体评语',
      improvement_suggestions: '改进建议',
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
      scoring_comments: {
        content: { score: 4, comment: '内容完整' },
        communication: { score: 4, comment: '语气恰当' },
        organisation: { score: 3, comment: '过渡可改进' },
        language: { score: 4, comment: '词汇丰富' },
      },
      correction_steps: {
        step1: 'step1 content',
        step2: 'step2 content',
        step3: 'step3 content',
        step4: [{ original: 'test', error_type: 'grammar', suggestion: 'fix' }],
        step5: 'step5 content',
        step6: 'step6 content',
      },
      structured_suggestions: [
        { icon: '📝', title: '词汇', detail: '建议' },
      ],
    };

    it('UT-001: should create correction with all structured fields', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockCorrection, error: null });

      const result = await createCorrection('sub-123', {
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
        scoring_comments: mockCorrection.scoring_comments,
        correction_steps: mockCorrection.correction_steps,
        structured_suggestions: mockCorrection.structured_suggestions,
      });

      expect(result).toEqual(mockCorrection);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          submission_id: 'sub-123',
          scoring_comments: mockCorrection.scoring_comments,
          correction_steps: mockCorrection.correction_steps,
          structured_suggestions: mockCorrection.structured_suggestions,
        })
      );
    });

    it('UT-002: should be backward compatible with old data format', async () => {
      const oldFormatCorrection: Correction = {
        id: 'corr-123',
        submission_id: 'sub-123',
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({ data: oldFormatCorrection, error: null });

      const result = await createCorrection('sub-123', {
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
      });

      expect(result).toEqual(oldFormatCorrection);
      expect(result.scoring_comments).toBeUndefined();
      expect(result.correction_steps).toBeUndefined();
      expect(result.structured_suggestions).toBeUndefined();
    });

    it('UT-005: should handle partial structured fields', async () => {
      const partialCorrection: Correction = {
        ...mockCorrection,
        correction_steps: null,
        structured_suggestions: null,
      };

      mockSupabase.single.mockResolvedValue({ data: partialCorrection, error: null });

      const result = await createCorrection('sub-123', {
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
        scoring_comments: mockCorrection.scoring_comments,
      });

      expect(result.scoring_comments).toEqual(mockCorrection.scoring_comments);
      expect(result.correction_steps).toBeNull();
      expect(result.structured_suggestions).toBeNull();
    });

    it('UT-007: should throw error on DB failure', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(
        createCorrection('sub-123', {
          content_score: 4,
          communication_score: 4,
          organization_score: 3,
          language_score: 4,
          total_score: 15,
          error_annotations: [],
          overall_comment: '总体评语',
          improvement_suggestions: '改进建议',
        })
      ).rejects.toThrow('Failed to create correction');
    });
  });

  describe('getCorrectionById', () => {
    it('UT-003: should return correction with all structured fields', async () => {
      const mockCorrection: Correction = {
        id: 'corr-123',
        submission_id: 'sub-123',
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        scoring_comments: {
          content: { score: 4, comment: '内容完整' },
          communication: { score: 4, comment: '语气恰当' },
          organisation: { score: 3, comment: '过渡可改进' },
          language: { score: 4, comment: '词汇丰富' },
        },
        correction_steps: {
          step1: 'step1',
          step2: 'step2',
          step3: 'step3',
          step4: [],
          step5: 'step5',
          step6: 'step6',
        },
        structured_suggestions: [{ icon: '📝', title: '词汇', detail: '建议' }],
      };

      mockSupabase.single.mockResolvedValue({ data: mockCorrection, error: null });

      const result = await getCorrectionById('corr-123');

      expect(result).toEqual(mockCorrection);
      expect(result?.scoring_comments).toBeDefined();
      expect(result?.correction_steps).toBeDefined();
      expect(result?.structured_suggestions).toBeDefined();
    });

    it('UT-004: should be backward compatible with old records (null fields)', async () => {
      const oldCorrection: Correction = {
        id: 'corr-old',
        submission_id: 'sub-123',
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        scoring_comments: null,
        correction_steps: null,
        structured_suggestions: null,
      };

      mockSupabase.single.mockResolvedValue({ data: oldCorrection, error: null });

      const result = await getCorrectionById('corr-old');

      expect(result).toEqual(oldCorrection);
      expect(result?.scoring_comments).toBeNull();
      expect(result?.correction_steps).toBeNull();
      expect(result?.structured_suggestions).toBeNull();
    });

    it('UT-006: should return null for non-existent correction', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getCorrectionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCorrectionBySubmissionId', () => {
    it('UT-008: should return correction with structured fields and exam_part', async () => {
      const mockData = {
        id: 'corr-123',
        submission_id: 'sub-123',
        content_score: 4,
        communication_score: 4,
        organization_score: 3,
        language_score: 4,
        total_score: 15,
        error_annotations: [],
        overall_comment: '总体评语',
        improvement_suggestions: '改进建议',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        scoring_comments: { content: { score: 4, comment: '内容完整' } },
        correction_steps: { step1: 'step1', step2: 'step2', step3: 'step3', step4: [], step5: 'step5', step6: 'step6' },
        structured_suggestions: [{ icon: '📝', title: '词汇', detail: '建议' }],
        essay_submissions: { exam_part: 'part1' },
      };

      mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

      const result = await getCorrectionBySubmissionId('sub-123');

      expect(result).toBeDefined();
      expect(result?.scoring_comments).toEqual(mockData.scoring_comments);
      expect(result?.correction_steps).toEqual(mockData.correction_steps);
      expect(result?.structured_suggestions).toEqual(mockData.structured_suggestions);
      expect(result?.exam_part).toBe('part1');
    });
  });
});
