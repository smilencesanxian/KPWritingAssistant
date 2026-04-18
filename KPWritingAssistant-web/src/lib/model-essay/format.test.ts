import {
  getModelEssayWordCount,
  getModelEssayWordCountLimits,
  normalizeModelEssayFormatting,
  parseModelEssayStructure,
} from './format';

describe('model essay format helpers', () => {
  test('excludes article title from Part2 article word count', () => {
    const text = [
      'The Joy of Reading',
      '',
      'Reading is one of my favourite hobbies because it helps me relax after school.',
      '',
      'I usually read adventure stories, and they often teach me something new.',
    ].join('\n');

    const result = getModelEssayWordCount(text, 'part2', 'q1');

    expect(result.titleLine).toBe('The Joy of Reading');
    expect(result.wordCount).toBe(26);
  });

  test('excludes email salutation and signoff from Part1 word count', () => {
    const text = [
      'Dear Mike,',
      '',
      'Thank you for your email. I would love to join the school trip next week.',
      '',
      'Best wishes,',
      'Lucy',
    ].join('\n');

    const result = getModelEssayWordCount(text, 'part1', null);

    expect(result.salutationLine).toBe('Dear Mike,');
    expect(result.signoffLines).toEqual(['Best wishes,', 'Lucy']);
    expect(result.wordCount).toBe(15);
  });

  test('counts Part2 story text without stripping the first line as title', () => {
    const text = [
      'I still remember that day clearly.',
      '',
      'We ran to the park and laughed together.',
    ].join('\n');

    const result = getModelEssayWordCount(text, 'part2', 'q2');

    expect(result.titleLine).toBeNull();
    expect(result.wordCount).toBe(14);
  });

  test('keeps body paragraphs for later rendering', () => {
    const structure = parseModelEssayStructure(
      'A Great Weekend\n\nWe visited a farm together.\n\nI learned a lot there.',
      'part2',
      'q1'
    );

    expect(structure.bodyParagraphs).toEqual([
      'We visited a farm together.',
      'I learned a lot there.',
    ]);
  });

  test('returns shared target limits', () => {
    expect(getModelEssayWordCountLimits()).toEqual({
      targetMin: 100,
      targetMax: 110,
      generationMin: 90,
      hardMax: 120,
    });
  });

  test('does not treat a long first sentence as article title', () => {
    const text = [
      'Nowadays many students spend too much time on mobile phones and forget to exercise regularly',
      '',
      'It is important to keep a healthy balance in daily life.',
    ].join('\n');

    const result = getModelEssayWordCount(text, 'part2', 'q1');

    expect(result.titleLine).toBeNull();
    expect(result.wordCount).toBeGreaterThan(18);
  });

  test('normalizes essay blocks with single blank lines', () => {
    const raw = [
      'The Joy of Reading',
      '',
      '',
      'Reading helps me relax after school. It also teaches me many things.',
      '',
      '',
      'I often read detective stories and share them with my friends.',
    ].join('\n');

    const normalized = normalizeModelEssayFormatting(raw, 'part2', 'q1');

    expect(normalized).toBe([
      'The Joy of Reading',
      '',
      'Reading helps me relax after school. It also teaches me many things.',
      '',
      'I often read detective stories and share them with my friends.',
    ].join('\n'));
  });
});
