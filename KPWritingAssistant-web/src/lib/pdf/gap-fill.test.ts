/**
 * Unit tests for gap-fill utility
 */

import {
  PET_HIGH_FREQUENCY_WORDS,
  getGapFillWords,
  shouldGapWord,
  createGap,
} from './gap-fill';
import type { Highlight } from '@/types/database';

describe('PET_HIGH_FREQUENCY_WORDS', () => {
  it('should contain a substantial list of words', () => {
    expect(PET_HIGH_FREQUENCY_WORDS.length).toBeGreaterThanOrEqual(50);
  });

  it('should contain common PET vocabulary words', () => {
    expect(PET_HIGH_FREQUENCY_WORDS).toContain('because');
    expect(PET_HIGH_FREQUENCY_WORDS).toContain('however');
    expect(PET_HIGH_FREQUENCY_WORDS).toContain('important');
    expect(PET_HIGH_FREQUENCY_WORDS).toContain('recommend');
    expect(PET_HIGH_FREQUENCY_WORDS).toContain('think');
  });

  it('should have all lowercase words', () => {
    for (const word of PET_HIGH_FREQUENCY_WORDS) {
      expect(word).toBe(word.toLowerCase());
    }
  });
});

describe('getGapFillWords', () => {
  it('should merge highlights and error words (UT-028-001)', () => {
    const highlights: Highlight[] = [
      { id: '1', user_id: 'user1', text: 'important', type: 'vocabulary', source_submission_id: null, source: 'user', recommended_phrase_id: null, created_at: '2024-01-01' },
    ];
    const errorWords = ['necessary'];
    const essay = 'It is important and necessary to study.';

    const result = getGapFillWords(highlights, errorWords, essay);

    expect(result).toContain('important');
    expect(result).toContain('necessary');
  });

  it('should deduplicate words case-insensitively (UT-028-002)', () => {
    const highlights: Highlight[] = [
      { id: '1', user_id: 'user1', text: 'Happy', type: 'vocabulary', source_submission_id: null, source: 'user', recommended_phrase_id: null, created_at: '2024-01-01' },
    ];
    const errorWords = ['happy'];
    const essay = 'I am Happy today.';

    const result = getGapFillWords(highlights, errorWords, essay);

    // Should only contain one instance (preserving original case from highlights)
    expect(result.filter(w => w.toLowerCase() === 'happy')).toHaveLength(1);
  });

  it('should only include vocabulary type highlights (UT-028-003)', () => {
    const highlights: Highlight[] = [
      { id: '1', user_id: 'user1', text: 'a phrase', type: 'phrase', source_submission_id: null, source: 'user', recommended_phrase_id: null, created_at: '2024-01-01' },
      { id: '2', user_id: 'user1', text: 'word', type: 'vocabulary', source_submission_id: null, source: 'user', recommended_phrase_id: null, created_at: '2024-01-01' },
    ];
    const errorWords: string[] = [];
    const essay = 'This is a phrase with a word.';

    const result = getGapFillWords(highlights, errorWords, essay);

    expect(result).toContain('word');
    expect(result).not.toContain('a phrase');
  });

  it('should include high-frequency words that appear in essay (UT-028-004)', () => {
    const highlights: Highlight[] = [];
    const errorWords: string[] = [];
    const essay = 'I think it is important to learn.';

    const result = getGapFillWords(highlights, errorWords, essay);

    expect(result).toContain('think');
    expect(result).toContain('important');
  });

  it('should not include high-frequency words not in essay (UT-028-006)', () => {
    const highlights: Highlight[] = [];
    const errorWords: string[] = [];
    const essay = 'Hello world today.';

    const result = getGapFillWords(highlights, errorWords, essay);

    expect(result).not.toContain('because');
    expect(result).not.toContain('however');
  });

  it('should handle case-insensitive matching for high-frequency words (UT-028-007)', () => {
    const highlights: Highlight[] = [];
    const errorWords: string[] = [];
    const essay = 'The IMPORTANT Thing is to practice.';

    const result = getGapFillWords(highlights, errorWords, essay);

    expect(result).toContain('important');
  });

  it('should handle empty inputs (UT-028-008)', () => {
    const result = getGapFillWords([], [], '');
    expect(result).toEqual([]);
  });

  it('should handle punctuation in essay (UT-028-009)', () => {
    const highlights: Highlight[] = [];
    const errorWords: string[] = [];
    const essay = 'Hello, world! Important.';

    const result = getGapFillWords(highlights, errorWords, essay);

    // "hello" and "world" are not high-frequency words
    // "important" is a high-frequency word
    expect(result).toContain('important');
    expect(result).not.toContain('hello');
    expect(result).not.toContain('world');
  });

  it('should merge all three sources and deduplicate (UT-028-013)', () => {
    const highlights: Highlight[] = [
      { id: '1', user_id: 'user1', text: 'happy', type: 'vocabulary', source_submission_id: null, source: 'user', recommended_phrase_id: null, created_at: '2024-01-01' },
    ];
    const errorWords = ['happy'];
    const essay = 'I am happy today.';

    const result = getGapFillWords(highlights, errorWords, essay);

    // Should only contain 'happy' once
    expect(result.filter(w => w.toLowerCase() === 'happy')).toHaveLength(1);
  });

  it('should handle special characters in words (UT-028-015)', () => {
    const highlights: Highlight[] = [
      { id: '1', user_id: 'user1', text: 'co-operation', type: 'vocabulary', source_submission_id: null, source: 'user', recommended_phrase_id: null, created_at: '2024-01-01' },
    ];
    const errorWords: string[] = [];
    const essay = 'The co-operation is important.';

    const result = getGapFillWords(highlights, errorWords, essay);

    expect(result).toContain('co-operation');
  });
});

describe('shouldGapWord', () => {
  it('should return true for words in gapFillWords', () => {
    expect(shouldGapWord('important', ['important', 'think'])).toBe(true);
  });

  it('should return false for words not in gapFillWords', () => {
    expect(shouldGapWord('hello', ['important', 'think'])).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(shouldGapWord('IMPORTANT', ['important'])).toBe(true);
    expect(shouldGapWord('Important', ['IMPORTANT'])).toBe(true);
  });

  it('should handle punctuation', () => {
    expect(shouldGapWord('important!', ['important'])).toBe(true);
    expect(shouldGapWord('"important"', ['important'])).toBe(true);
  });

  it('should return false for empty inputs', () => {
    expect(shouldGapWord('', ['important'])).toBe(false);
    expect(shouldGapWord('word', [])).toBe(false);
  });
});

describe('createGap', () => {
  it('should create underscores matching word length', () => {
    expect(createGap('cat')).toBe('___');
    expect(createGap('hello')).toBe('_____');
    expect(createGap('international')).toBe('_____________');
  });

  it('should preserve leading punctuation', () => {
    expect(createGap('"hello')).toBe('"_____');
    expect(createGap('(cat)')).toBe('(___)');
  });

  it('should preserve trailing punctuation', () => {
    expect(createGap('hello!')).toBe('_____!');
    expect(createGap('cat.')).toBe('___.');
  });

  it('should preserve both leading and trailing punctuation', () => {
    expect(createGap('"hello"')).toBe('"_____"');
    expect(createGap('(important!)')).toBe('(_________!)');
    expect(createGap('word.')).toBe('____.');
  });

  it('should handle single character words', () => {
    expect(createGap('a')).toBe('_');
    expect(createGap('I')).toBe('_');
  });
});
