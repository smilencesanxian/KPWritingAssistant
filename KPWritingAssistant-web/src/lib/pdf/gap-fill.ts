/**
 * Gap-fill utility for dictation mode copybooks.
 * Determines which words should be replaced with blanks in the essay.
 */

import type { Highlight as DBHighlight } from '@/types/database';

/**
 * PET high-frequency vocabulary words commonly used in PET writing.
 * These words will be considered for gap-filling if they appear in the essay.
 */
export const PET_HIGH_FREQUENCY_WORDS: string[] = [
  // Connectors and transitions
  'because', 'however', 'although', 'therefore', 'moreover', 'furthermore',
  'nevertheless', 'otherwise', 'meanwhile', 'besides', 'instead', 'otherwise',
  // Opinion and expression
  'important', 'necessary', 'essential', 'recommend', 'suggest', 'believe',
  'think', 'feel', 'hope', 'want', 'need', 'prefer', 'decide', 'choose',
  // Common verbs
  'improve', 'develop', 'increase', 'decrease', 'change', 'agree', 'disagree',
  'enjoy', 'explain', 'describe', 'discuss', 'compare', 'consider', 'expect',
  // Nouns
  'advantage', 'disadvantage', 'opinion', 'experience', 'opportunity',
  'environment', 'situation', 'problem', 'solution', 'reason', 'result',
  // Modals and helpers
  'should', 'could', 'would', 'might', 'must', 'can', 'may',
  // Adjectives and adverbs
  'different', 'similar', 'special', 'certain', 'particular', 'especially',
  'probably', 'definitely', 'actually', 'usually', 'suddenly', 'finally',
  // Common phrases components
  'help', 'make', 'take', 'get', 'go', 'come', 'see', 'know',
  'people', 'time', 'way', 'thing', 'place', 'life', 'year',
];

/**
 * Normalize a word for comparison (lowercase, remove punctuation).
 */
function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, '') // Remove leading/trailing punctuation
    .trim();
}

/**
 * Extract words from essay text for matching.
 */
function extractEssayWords(essay: string): Set<string> {
  const words = new Set<string>();
  // Split by whitespace and punctuation, then normalize
  const tokens = essay.split(/[\s\p{P}]+/u).filter(Boolean);
  for (const token of tokens) {
    const normalized = normalizeWord(token);
    if (normalized.length > 0) {
      words.add(normalized);
    }
  }
  return words;
}

/**
 * Get the list of words that should be gapped in the dictation mode.
 * Combines:
 * 1. User's vocabulary highlights from their highlight library
 * 2. Error words from the correction (original incorrect words)
 * 3. PET high-frequency words that appear in the essay
 *
 * @param highlights - User's highlight records (only vocabulary type will be used)
 * @param errorWords - List of error words from the correction
 * @param essay - The essay text to check for high-frequency words
 * @returns Array of unique words to be gapped (preserving original case from inputs)
 */
export function getGapFillWords(
  highlights: DBHighlight[],
  errorWords: string[],
  essay: string
): string[] {
  const gapWords = new Set<string>();
  const normalizedMap = new Map<string, string>(); // normalized -> original

  // 1. Add vocabulary highlights (type === 'vocabulary')
  for (const highlight of highlights) {
    if (highlight.type === 'vocabulary') {
      const normalized = normalizeWord(highlight.text);
      if (normalized.length > 0 && !normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, highlight.text);
        gapWords.add(highlight.text);
      }
    }
  }

  // 2. Add error words
  for (const errorWord of errorWords) {
    const normalized = normalizeWord(errorWord);
    if (normalized.length > 0 && !normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, errorWord);
      gapWords.add(errorWord);
    }
  }

  // 3. Add high-frequency words that appear in the essay
  const essayWords = extractEssayWords(essay);
  for (const hfWord of PET_HIGH_FREQUENCY_WORDS) {
    if (essayWords.has(hfWord) && !normalizedMap.has(hfWord)) {
      normalizedMap.set(hfWord, hfWord);
      gapWords.add(hfWord);
    }
  }

  return Array.from(gapWords);
}

/**
 * Check if a word should be gapped (case-insensitive).
 * Used by the renderer to determine if a word should be replaced with underscores.
 *
 * @param word - The word to check
 * @param gapFillWords - The list of words to gap
 * @returns true if the word should be gapped
 */
export function shouldGapWord(word: string, gapFillWords: string[]): boolean {
  const normalized = normalizeWord(word);
  if (normalized.length === 0) return false;

  for (const gapWord of gapFillWords) {
    if (normalizeWord(gapWord) === normalized) {
      return true;
    }
  }
  return false;
}

/**
 * Create a gap (underscores) matching the length of a word.
 * Preserves any leading/trailing punctuation from the original word.
 *
 * @param word - The original word
 * @returns String with the word replaced by underscores, preserving punctuation
 */
export function createGap(word: string): string {
  // Extract leading and trailing punctuation
  const leadingMatch = word.match(/^[\p{P}\s]*/u);
  const trailingMatch = word.match(/[\p{P}\s]*$/u);

  const leading = leadingMatch ? leadingMatch[0] : '';
  const trailing = trailingMatch ? trailingMatch[0] : '';

  // Get the core word (without punctuation)
  const coreWord = word.slice(leading.length, word.length - trailing.length);

  // Create underscores matching the core word length
  const underscores = '_'.repeat(coreWord.length);

  return leading + underscores + trailing;
}
