import { restoreOcrEssayLayout } from './layout';

describe('restoreOcrEssayLayout', () => {
  it('keeps title, body paragraphs, and signoff as separate blocks', () => {
    const input = [
      'The Joy of Reading',
      'Reading is one of my favourite hobbies.',
      'It helps me relax after school.',
      'Best wishes,',
      'Lucy',
    ].join('\n');

    expect(restoreOcrEssayLayout(input)).toBe(
      [
        'The Joy of Reading',
        '',
        'Reading is one of my favourite hobbies. It helps me relax after school.',
        '',
        'Best wishes, Lucy',
      ].join('\n')
    );
  });

  it('removes obvious OCR noise lines', () => {
    const input = ['CAMBRIDGE ENGLISH', 'Question 2', 'My essay text', '119'].join('\n');

    expect(restoreOcrEssayLayout(input)).toBe('My essay text');
  });

  it('preserves email salutation as its own block', () => {
    const input = ['Dear Mike,', 'I am writing to tell you about my trip.', 'See you soon.'].join('\n');

    expect(restoreOcrEssayLayout(input)).toBe(
      ['Dear Mike,', '', 'I am writing to tell you about my trip. See you soon.'].join('\n')
    );
  });
});
