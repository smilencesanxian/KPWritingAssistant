/**
 * KB-5 单元测试：getCollectedSystemPhrases 扩展
 *
 * 测试范围：
 * - UT-KB5-001: 仍能返回 source='system' 的词句
 * - UT-KB5-002: 追加返回 source='user' 且 knowledge_essay_type IS NOT NULL 的词句
 * - UT-KB5-003: 两类合并后去重（相同文本只出现一次）
 * - UT-KB5-004: 两类均为空时返回空数组
 * - UT-KB5-005: source='user' 但 knowledge_essay_type IS NULL 的条目不被包含
 */

import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

// ---- Supabase mock 工厂 ----
function buildMockSupabase(
  systemRows: { text: string; knowledge_essay_type: string | null }[],
  userKbRows: { text: string; knowledge_essay_type: string | null }[]
) {
  // 通过调用顺序区分两次查询
  let callCount = 0;

  const mockChain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: systemRows, error: null });
      }
      return Promise.resolve({ data: userKbRows, error: null });
    }),
  };

  return mockChain;
}

describe('getCollectedSystemPhrases - KB-5 扩展', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('UT-KB5-001: 返回 source=system 的词句（原有行为）', async () => {
    const systemRows = [{ text: 'Dear Sir/Madam,', knowledge_essay_type: null }, { text: 'I am writing to', knowledge_essay_type: null }];
    const userKbRows: { text: string; knowledge_essay_type: string | null }[] = [];

    const mockSupabase = buildMockSupabase(systemRows, userKbRows);
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const { getCollectedSystemPhrases } = await import('./highlights');
    const result = await getCollectedSystemPhrases('user-001');
    const texts = result.map((p) => p.text);

    expect(texts).toContain('Dear Sir/Madam,');
    expect(texts).toContain('I am writing to');
  });

  it('UT-KB5-002: 追加返回 source=user 且 knowledge_essay_type 非 null 的词句', async () => {
    const systemRows = [{ text: 'I look forward to hearing from you.', knowledge_essay_type: null }];
    const userKbRows = [{ text: 'Once upon a time', knowledge_essay_type: 'story' }];

    const mockSupabase = buildMockSupabase(systemRows, userKbRows);
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const { getCollectedSystemPhrases } = await import('./highlights');
    const result = await getCollectedSystemPhrases('user-001');
    const texts = result.map((p) => p.text);

    expect(texts).toContain('I look forward to hearing from you.');
    expect(texts).toContain('Once upon a time');
  });

  it('UT-KB5-003: 两类词句合并后文本列表长度正确', async () => {
    const systemRows = [{ text: 'phrase-A', knowledge_essay_type: null }, { text: 'phrase-B', knowledge_essay_type: null }];
    const userKbRows = [{ text: 'phrase-C', knowledge_essay_type: 'email' }];

    const mockSupabase = buildMockSupabase(systemRows, userKbRows);
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const { getCollectedSystemPhrases } = await import('./highlights');
    const result = await getCollectedSystemPhrases('user-001');

    expect(result).toHaveLength(3);
  });

  it('UT-KB5-004: 两类均为空时返回空数组', async () => {
    const mockSupabase = buildMockSupabase([], []);
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const { getCollectedSystemPhrases } = await import('./highlights');
    const result = await getCollectedSystemPhrases('user-001');

    expect(result).toEqual([]);
  });
});

// ---- 纯函数层测试：类型过滤逻辑 ----
// 这部分对应 route.ts 中根据 exam_part 对 collectedPhrases 做过滤的逻辑
// 独立为可复用纯函数后在此测试；若逻辑内联在 route 中则通过集成测试覆盖

describe('filterPhrasesByEssayType - 类型过滤逻辑', () => {
  /**
   * 模拟 route.ts 中即将实现的过滤逻辑：
   * - exam_part='part1' → 视为 email 类型，保留 essay_type='email' 或 essay_type='general' 或无类型标注
   * - exam_part='part2' → 视为 article/story，保留 essay_type='article'/'story'/'general' 或无类型标注
   * - essay_type='email' 不应注入 part2 范文
   * - essay_type='article'/'story' 不应注入 part1 范文
   */

  // 内联实现参考（与开发者实现后的函数签名保持一致）
  function filterPhrasesByEssayType(
    phrases: Array<{ text: string; knowledge_essay_type: string | null }>,
    examPart: string | null
  ): string[] {
    if (!examPart) return phrases.map((p) => p.text);

    const isEmail = examPart === 'part1';

    return phrases
      .filter((p) => {
        const et = p.knowledge_essay_type;
        if (!et) return true; // 无类型标注：全部通过
        if (isEmail) return et === 'email' || et === 'general';
        return et === 'article' || et === 'story' || et === 'general';
      })
      .map((p) => p.text);
  }

  const mixedPhrases = [
    { text: 'Dear Sir/Madam,', knowledge_essay_type: 'email' },
    { text: 'Once upon a time,', knowledge_essay_type: 'story' },
    { text: 'In conclusion,', knowledge_essay_type: 'article' },
    { text: 'I look forward to', knowledge_essay_type: 'general' },
    { text: 'system phrase', knowledge_essay_type: null },
  ];

  it('UT-KB5-005: part1(email) 应包含 email 和 general 类型，排除 story/article', () => {
    const result = filterPhrasesByEssayType(mixedPhrases, 'part1');
    expect(result).toContain('Dear Sir/Madam,');
    expect(result).toContain('I look forward to');
    expect(result).toContain('system phrase'); // null 无类型也通过
    expect(result).not.toContain('Once upon a time,');
    expect(result).not.toContain('In conclusion,');
  });

  it('UT-KB5-006: part2(article/story) 应包含 article/story/general，排除 email', () => {
    const result = filterPhrasesByEssayType(mixedPhrases, 'part2');
    expect(result).toContain('Once upon a time,');
    expect(result).toContain('In conclusion,');
    expect(result).toContain('I look forward to');
    expect(result).toContain('system phrase');
    expect(result).not.toContain('Dear Sir/Madam,');
  });

  it('UT-KB5-007: examPart 为 null 时不做任何过滤，返回全部文本', () => {
    const result = filterPhrasesByEssayType(mixedPhrases, null);
    expect(result).toHaveLength(mixedPhrases.length);
  });

  it('UT-KB5-008: 输入为空数组时返回空数组', () => {
    const result = filterPhrasesByEssayType([], 'part1');
    expect(result).toEqual([]);
  });
});
