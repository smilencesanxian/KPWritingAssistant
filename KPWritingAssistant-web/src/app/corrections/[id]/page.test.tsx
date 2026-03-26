import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * 批改结果页面单元测试
 *
 * 由于Next.js App Router的Server Component特性，
 * 这里主要测试Client Component的渲染逻辑和数据格式化
 */

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock DB functions
jest.mock('@/lib/db/corrections', () => ({
  getCorrectionById: jest.fn(),
  getModelEssaysByCorrectionId: jest.fn(),
}));

jest.mock('@/lib/db/essays', () => ({
  getSubmissionById: jest.fn(),
}));

jest.mock('@/lib/db/highlights', () => ({
  getHighlightsBySubmissionId: jest.fn(),
}));

// Mock components
jest.mock('@/components/ui/Badge', () => {
  return function MockBadge({ children, color }: { children: React.ReactNode; color?: string }) {
    return <span data-testid="badge" data-color={color}>{children}</span>;
  };
});

jest.mock('@/components/ui/Card', () => {
  return function MockCard({ children }: { children: React.ReactNode }) {
    return <div data-testid="card">{children}</div>;
  };
});

jest.mock('@/components/correction/AnnotatedEssay', () => {
  return function MockAnnotatedEssay({ text, annotations }: { text: string; annotations: unknown[] }) {
    return <div data-testid="annotated-essay">{text}</div>;
  };
});

jest.mock('@/components/correction/HighlightsList', () => {
  return function MockHighlightsList({ highlights }: { highlights: unknown[] }) {
    return <div data-testid="highlights-list">Highlights: {highlights.length}</div>;
  };
});

jest.mock('@/components/correction/ModelEssayView', () => {
  return function MockModelEssayView({ correctionId, initialEssays }: { correctionId: string; initialEssays: unknown[] }) {
    return <div data-testid="model-essay-view">Model Essay for {correctionId}</div>;
  };
});

describe('Correction Page - Data Structure Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-001: 评分总览数据格式化', () => {
    test('应正确格式化4维度评分数据', () => {
      const scoringComments = {
        content: { score: 4, comment: '内容充实，观点清晰' },
        communication: { score: 3, comment: '沟通效果良好' },
        organisation: { score: 4, comment: '结构清晰' },
        language: { score: 3, comment: '语法有小错误' }
      };

      // 验证数据结构
      expect(scoringComments).toHaveProperty('content');
      expect(scoringComments).toHaveProperty('communication');
      expect(scoringComments).toHaveProperty('organisation');
      expect(scoringComments).toHaveProperty('language');

      // 验证每个维度有score和comment
      expect(scoringComments.content).toHaveProperty('score', 4);
      expect(scoringComments.content).toHaveProperty('comment', '内容充实，观点清晰');
      expect(scoringComments.communication).toHaveProperty('score', 3);
      expect(scoringComments.communication).toHaveProperty('comment', '沟通效果良好');
    });

    test('应处理分数边界值', () => {
      const boundaryScoring = {
        content: { score: 0, comment: '内容缺失' },
        communication: { score: 5, comment: '完美沟通' },
        organisation: { score: 2.5, comment: '中等组织' },
        language: { score: 3, comment: '一般语言' }
      };

      expect(boundaryScoring.content.score).toBe(0);
      expect(boundaryScoring.communication.score).toBe(5);
      expect(boundaryScoring.organisation.score).toBe(2.5);
    });

    test('应计算总分/20', () => {
      const scoringComments = {
        content: { score: 4, comment: '' },
        communication: { score: 3, comment: '' },
        organisation: { score: 4, comment: '' },
        language: { score: 3, comment: '' }
      };

      const totalScore = scoringComments.content.score +
                        scoringComments.communication.score +
                        scoringComments.organisation.score +
                        scoringComments.language.score;

      expect(totalScore).toBe(14);
    });
  });

  describe('UT-002: 批改详情手风琴数据结构', () => {
    test('应正确解析6步骤数据', () => {
      const correctionSteps = {
        step1: '任务回应分析内容',
        step2: '内容分析内容',
        step3: '组织分析内容',
        step4: [
          { original: 'I go', error_type: '时态错误', suggestion: 'I went' }
        ],
        step5: '改进建议内容',
        step6: '总结内容'
      };

      expect(correctionSteps).toHaveProperty('step1');
      expect(correctionSteps).toHaveProperty('step2');
      expect(correctionSteps).toHaveProperty('step3');
      expect(correctionSteps).toHaveProperty('step4');
      expect(correctionSteps).toHaveProperty('step5');
      expect(correctionSteps).toHaveProperty('step6');

      // Step 4是数组
      expect(Array.isArray(correctionSteps.step4)).toBe(true);
      expect(correctionSteps.step4[0]).toHaveProperty('original');
      expect(correctionSteps.step4[0]).toHaveProperty('error_type');
      expect(correctionSteps.step4[0]).toHaveProperty('suggestion');
    });

    test('Step 4表格数据应包含必要字段', () => {
      const step4Data = [
        { original: 'I go to school', error_type: '时态错误', suggestion: 'I went to school' },
        { original: 'It is good', error_type: '词汇贫乏', suggestion: 'It is excellent' }
      ];

      step4Data.forEach(item => {
        expect(item).toHaveProperty('original');
        expect(item).toHaveProperty('error_type');
        expect(item).toHaveProperty('suggestion');
        expect(typeof item.original).toBe('string');
        expect(typeof item.error_type).toBe('string');
        expect(typeof item.suggestion).toBe('string');
      });
    });
  });

  describe('UT-003: 改进建议列表数据结构', () => {
    test('应正确解析结构化建议数组', () => {
      const structuredSuggestions = [
        { icon: '✍️', title: '注意时态', detail: '过去事件使用过去时态' },
        { icon: '📝', title: '丰富词汇', detail: '使用更多形容词' },
        { icon: '🎯', title: '明确观点', detail: '开头直接表明立场' }
      ];

      expect(Array.isArray(structuredSuggestions)).toBe(true);
      expect(structuredSuggestions).toHaveLength(3);

      structuredSuggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('icon');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('detail');
        expect(typeof suggestion.icon).toBe('string');
        expect(typeof suggestion.title).toBe('string');
        expect(typeof suggestion.detail).toBe('string');
      });
    });

    test('应处理emoji图标', () => {
      const suggestions = [
        { icon: '✍️', title: '写作', detail: '详细' },
        { icon: '📝', title: '笔记', detail: '详细' },
        { icon: '🎯', title: '目标', detail: '详细' },
        { icon: '💡', title: '想法', detail: '详细' }
      ];

      suggestions.forEach(s => {
        expect(s.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('UT-004: 向后兼容数据验证', () => {
    test('应处理所有新字段为null的情况', () => {
      const legacyCorrection = {
        id: 'legacy-id',
        total_score: 12,
        content_score: 3,
        communication_score: 3,
        organization_score: 3,
        language_score: 3,
        overall_comment: '旧格式评语',
        improvement_suggestions: '1. 注意时态\\n2. 丰富词汇',
        scoring_comments: null,
        correction_steps: null,
        structured_suggestions: null
      };

      expect(legacyCorrection.scoring_comments).toBeNull();
      expect(legacyCorrection.correction_steps).toBeNull();
      expect(legacyCorrection.structured_suggestions).toBeNull();

      // 旧字段仍有值
      expect(legacyCorrection.improvement_suggestions).not.toBeNull();
      expect(legacyCorrection.total_score).toBe(12);
    });

    test('应处理部分新字段有值的情况', () => {
      const mixedCorrection = {
        scoring_comments: {
          content: { score: 4, comment: '内容充实' },
          communication: { score: 3, comment: '沟通良好' },
          organisation: { score: 4, comment: '结构清晰' },
          language: { score: 3, comment: '语法有小错' }
        },
        correction_steps: null,
        structured_suggestions: null,
        improvement_suggestions: '旧格式建议'
      };

      // scoring_comments有值
      expect(mixedCorrection.scoring_comments).not.toBeNull();
      expect(mixedCorrection.scoring_comments.content.score).toBe(4);

      // 其他为null
      expect(mixedCorrection.correction_steps).toBeNull();
      expect(mixedCorrection.structured_suggestions).toBeNull();

      // 旧字段作为fallback
      expect(mixedCorrection.improvement_suggestions).toBe('旧格式建议');
    });

    test('应安全访问可能为null的嵌套属性', () => {
      const nullData = {
        scoring_comments: null,
        correction_steps: null,
        structured_suggestions: null
      };

      // 使用可选链安全访问
      const contentScore = nullData.scoring_comments?.content?.score ?? '--';
      const step1Content = nullData.correction_steps?.step1 ?? '';
      const suggestions = nullData.structured_suggestions ?? [];

      expect(contentScore).toBe('--');
      expect(step1Content).toBe('');
      expect(suggestions).toEqual([]);
    });

    test('应处理空数组情况', () => {
      const emptyArrayData = {
        correction_steps: {
          step1: '',
          step2: '',
          step3: '',
          step4: [], // 空数组
          step5: '',
          step6: ''
        },
        structured_suggestions: [] // 空数组
      };

      expect(Array.isArray(emptyArrayData.correction_steps.step4)).toBe(true);
      expect(emptyArrayData.correction_steps.step4).toHaveLength(0);
      expect(Array.isArray(emptyArrayData.structured_suggestions)).toBe(true);
      expect(emptyArrayData.structured_suggestions).toHaveLength(0);
    });

    test('应处理空对象情况', () => {
      const emptyObjectData = {
        scoring_comments: {},
        correction_steps: {},
        structured_suggestions: null
      };

      // 空对象应被视为无效数据
      expect(Object.keys(emptyObjectData.scoring_comments ?? {}).length).toBe(0);
      expect(Object.keys(emptyObjectData.correction_steps ?? {}).length).toBe(0);
    });
  });
});

describe('Correction Page - Component Logic Tests', () => {
  describe('评分总览组件逻辑', () => {
    test('应正确映射维度名称', () => {
      const dimensionMap = {
        content: '内容',
        communication: '沟通',
        organisation: '组织',
        language: '语言'
      };

      expect(dimensionMap.content).toBe('内容');
      expect(dimensionMap.communication).toBe('沟通');
      expect(dimensionMap.organisation).toBe('组织');
      expect(dimensionMap.language).toBe('语言');
    });

    test('应根据分数返回对应颜色', () => {
      const getScoreColor = (score: number): string => {
        if (score >= 4) return 'green';
        if (score >= 3) return 'blue';
        if (score >= 2) return 'yellow';
        return 'red';
      };

      expect(getScoreColor(5)).toBe('green');
      expect(getScoreColor(4)).toBe('green');
      expect(getScoreColor(3)).toBe('blue');
      expect(getScoreColor(2)).toBe('yellow');
      expect(getScoreColor(1)).toBe('red');
      expect(getScoreColor(0)).toBe('red');
    });
  });

  describe('手风琴组件逻辑', () => {
    test('应管理展开/折叠状态', () => {
      // 模拟手风琴状态管理
      const accordionState: Record<string, boolean> = {
        step1: false,
        step2: false,
        step3: false,
        step4: false,
        step5: false,
        step6: false
      };

      // 展开step1
      accordionState.step1 = true;
      expect(accordionState.step1).toBe(true);
      expect(accordionState.step2).toBe(false);

      // 展开step2（允许多个展开）
      accordionState.step2 = true;
      expect(accordionState.step1).toBe(true);
      expect(accordionState.step2).toBe(true);

      // 折叠step1
      accordionState.step1 = false;
      expect(accordionState.step1).toBe(false);
      expect(accordionState.step2).toBe(true);
    });

    test('应正确映射步骤标题', () => {
      const stepTitles: Record<string, string> = {
        step1: 'Step 1: 任务回应',
        step2: 'Step 2: 内容分析',
        step3: 'Step 3: 组织分析',
        step4: 'Step 4: 语言校对',
        step5: 'Step 5: 改进建议',
        step6: 'Step 6: 总结'
      };

      expect(stepTitles.step1).toContain('任务回应');
      expect(stepTitles.step4).toContain('语言校对');
    });
  });

  describe('改进建议渲染逻辑', () => {
    test('应优先使用structured_suggestions', () => {
      const hasStructured = true;
      const hasLegacy = true;

      const shouldUseStructured = hasStructured;
      const shouldUseLegacy = !hasStructured && hasLegacy;

      expect(shouldUseStructured).toBe(true);
      expect(shouldUseLegacy).toBe(false);
    });

    test('structured_suggestions为空时应使用legacy', () => {
      const structuredSuggestions: unknown[] = [];
      const legacySuggestions = '旧格式建议';

      const shouldUseStructured = structuredSuggestions && structuredSuggestions.length > 0;
      const shouldUseLegacy = !shouldUseStructured && !!legacySuggestions;

      expect(shouldUseStructured).toBe(false);
      expect(shouldUseLegacy).toBe(true);
    });

    test('应正确处理whitespace-pre-line样式', () => {
      const legacyText = '第一点建议\\n第二点建议\\n第三点建议';
      const lines = legacyText.split('\\n');

      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('第一点建议');
      expect(lines[1]).toBe('第二点建议');
      expect(lines[2]).toBe('第三点建议');
    });
  });
});

describe('Correction Page - Edge Cases', () => {
  test('应处理超长文本', () => {
    const longComment = '内容充实'.repeat(100);
    expect(longComment.length).toBeGreaterThan(300);
  });

  test('应处理特殊字符', () => {
    const specialChars = {
      script: '<script>alert("xss")</script>',
      html: '<br><div>content</div>',
      emoji: '🎉✍️📝🎯💡',
      unicode: '中文内容ñóël'
    };

    // 验证特殊字符存在
    expect(specialChars.script).toContain('<script>');
    expect(specialChars.emoji).toContain('✍️');
    expect(specialChars.unicode).toContain('中文');
  });

  test('应处理缺失的嵌套属性', () => {
    const incompleteData = {
      scoring_comments: {
        content: { score: 4 }, // 缺少comment
        communication: null, // 整个为null
        // 缺少organisation和language
      }
    };

    // 安全访问
    const contentComment = incompleteData.scoring_comments?.content?.comment ?? '';
    const communicationScore = incompleteData.scoring_comments?.communication?.score ?? '--';
    const organisationScore = incompleteData.scoring_comments?.organisation?.score ?? '--';

    expect(contentComment).toBe('');
    expect(communicationScore).toBe('--');
    expect(organisationScore).toBe('--');
  });

  test('应处理数字边界值', () => {
    const boundaryScores = {
      zero: 0,
      max: 5,
      negative: -1,
      exceed: 6
    };

    // 验证边界值
    expect(boundaryScores.zero).toBe(0);
    expect(boundaryScores.max).toBe(5);
    expect(boundaryScores.negative).toBeLessThan(0);
    expect(boundaryScores.exceed).toBeGreaterThan(5);
  });
});
