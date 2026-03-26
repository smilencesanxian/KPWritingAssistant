import { correctEssay } from './llm';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

describe('llm correction', () => {
  const mockCreate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    } as unknown as OpenAI));
  });

  describe('extractScores (via correctEssay)', () => {
    it('UT-009: should extract scores from new structured format (scoring_overview)', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              scoring_overview: {
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
              improvement_suggestions: [{ icon: '📝', title: '词汇', detail: '建议' }],
              highlights: [],
              model_essay: '范文',
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await correctEssay('test essay');

      expect(result.scores).toEqual({
        content: 4,
        communication: 4,
        organization: 3,
        language: 4,
        total: 15,
      });
    });

    it('UT-010: should be backward compatible with legacy format (scores)', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              scores: {
                content: 4,
                communication: 4,
                organization: 3,
                language: 4,
                total: 15,
              },
              overall_comment: '总体评语',
              improvement_suggestions: '改进建议',
              error_annotations: [],
              highlights: [],
              error_summary: [],
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await correctEssay('test essay');

      expect(result.scores).toEqual({
        content: 4,
        communication: 4,
        organization: 3,
        language: 4,
        total: 15,
      });
    });
  });

  describe('validateCorrectionResult (via correctEssay)', () => {
    it('UT-011: should validate new structured format', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              scoring_overview: {
                content: { score: 4, comment: '内容' },
                communication: { score: 4, comment: '沟通' },
                organisation: { score: 3, comment: '组织' },
                language: { score: 4, comment: '语言' },
              },
              correction_steps: {
                step1: 's1',
                step2: 's2',
                step3: 's3',
                step4: [],
                step5: 's5',
                step6: 's6',
              },
              improvement_suggestions: [{ icon: '📝', title: '词汇', detail: '建议' }],
              highlights: [],
              model_essay: '范文',
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await correctEssay('test essay');

      expect(result).toBeDefined();
      expect(result.scoring_overview).toBeDefined();
      expect(result.correction_steps).toBeDefined();
    });

    it('UT-012: should validate legacy format', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              scores: {
                content: 4,
                communication: 4,
                organization: 3,
                language: 4,
                total: 15,
              },
              overall_comment: '总体评语',
              improvement_suggestions: '改进建议',
              error_annotations: [],
              highlights: [],
              error_summary: [],
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await correctEssay('test essay');

      expect(result).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.error_annotations).toEqual([]);
      expect(result.error_summary).toEqual([]);
    });

    it('UT-013: should reject invalid format', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              // Missing required fields
              some_random_field: 'value',
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      // Should retry 3 times then throw
      await expect(correctEssay('test essay')).rejects.toThrow('作文批改失败');
      expect(mockCreate).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('backward compatibility fields', () => {
    it('should populate legacy fields from new format', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              scoring_overview: {
                content: { score: 4, comment: '内容' },
                communication: { score: 4, comment: '沟通' },
                organisation: { score: 3, comment: '组织' },
                language: { score: 4, comment: '语言' },
              },
              correction_steps: {
                step1: 's1',
                step2: 's2',
                step3: 's3',
                step4: [],
                step5: 's5',
                step6: '总体评语内容',
              },
              improvement_suggestions: [
                { icon: '📝', title: '词汇', detail: '建议详情' },
              ],
              highlights: [],
              model_essay: '范文',
            }),
          },
        }],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await correctEssay('test essay');

      // Should populate overall_comment from step6
      expect(result.overall_comment).toBe('总体评语内容');
      // Should have error_annotations array
      expect(result.error_annotations).toEqual([]);
      // Should have error_summary array
      expect(result.error_summary).toEqual([]);
    });
  });
});
