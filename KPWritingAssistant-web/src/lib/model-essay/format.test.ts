import {
  getModelEssayWordCount,
  getModelEssayWordCountLimits,
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
      hardMax: 120,
    });
  });
});
