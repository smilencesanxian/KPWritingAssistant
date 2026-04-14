import {
  buildCorrectionUserPrompt,
  getCorrectionSystemPrompt,
} from './prompts';

describe('AI prompts', () => {
  test('Part2 article correction prompt should include article-specific guidance', () => {
    const systemPrompt = getCorrectionSystemPrompt('part2', 'q1');
    const userPrompt = buildCorrectionUserPrompt('Test article text', 'part2', 'q1');

    expect(systemPrompt).toContain('Part 2 Article 额外要求');
    expect(systemPrompt).toContain('step5 必须输出亮点词句分析');
    expect(userPrompt).toContain('Part 2 Article');
  });

  test('Part2 story correction prompt should include story-specific guidance', () => {
    const systemPrompt = getCorrectionSystemPrompt('part2', 'q2');
    const userPrompt = buildCorrectionUserPrompt('Test story text', 'part2', 'q2');

    expect(systemPrompt).toContain('Part 2 Story 额外要求');
    expect(systemPrompt).toContain('不得按 Article 标准批改');
    expect(userPrompt).toContain('Part 2 Story');
  });
});
