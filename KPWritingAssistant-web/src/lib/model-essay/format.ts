export interface ModelEssayStructure {
  normalizedText: string;
  titleLine: string | null;
  salutationLine: string | null;
  signoffLines: string[];
  bodyParagraphs: string[];
}

export interface ModelEssayWordCountResult extends ModelEssayStructure {
  wordCount: number;
  withinTargetRange: boolean;
  withinHardLimit: boolean;
}

const TARGET_MIN_WORDS = 100;
const TARGET_MAX_WORDS = 110;
const GENERATION_MIN_WORDS = 90;
const HARD_MAX_WORDS = 130;

const SALUTATION_RE = /^(dear|hi|hello)\b/i;
const SIGNOFF_RE = /^(best wishes|best regards|regards|yours|yours sincerely|yours faithfully|love)\b/i;
const TITLE_RE = /^[A-Z][^.!?]*$/;

function normalizeEssayText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function getRawLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim());
}

export function parseModelEssayStructure(
  text: string,
  examPart?: 'part1' | 'part2' | null,
  questionType?: 'q1' | 'q2' | null
): ModelEssayStructure {
  const normalizedText = normalizeEssayText(text);
  const rawLines = getRawLines(normalizedText);
  const nonEmptyLineIndexes = rawLines
    .map((line, index) => (line ? index : -1))
    .filter((index) => index >= 0);
  const lines = rawLines.filter(Boolean);

  let titleLine: string | null = null;
  let salutationLine: string | null = null;
  let signoffLines: string[] = [];
  let bodyText = normalizedText;

  if (examPart === 'part1' && lines.length > 0 && SALUTATION_RE.test(lines[0])) {
    salutationLine = lines[0];
    const salutationIndex = nonEmptyLineIndexes[0] ?? 0;
    let signoffStart = -1;
    for (let index = nonEmptyLineIndexes.length - 1; index >= 1; index -= 1) {
      const lineIndex = nonEmptyLineIndexes[index];
      if (SIGNOFF_RE.test(rawLines[lineIndex])) {
        signoffStart = lineIndex;
        break;
      }
    }

    const bodyLines = signoffStart === -1
      ? rawLines.slice(salutationIndex + 1)
      : rawLines.slice(salutationIndex + 1, signoffStart);
    signoffLines = signoffStart === -1 ? [] : rawLines.slice(signoffStart).filter(Boolean);
    bodyText = bodyLines.join('\n');
  } else if (examPart === 'part2' && questionType === 'q1' && lines.length > 0 && TITLE_RE.test(lines[0])) {
    titleLine = lines[0];
    const titleIndex = nonEmptyLineIndexes[0] ?? 0;
    bodyText = rawLines.slice(titleIndex + 1).join('\n');
  }

  return {
    normalizedText,
    titleLine,
    salutationLine,
    signoffLines,
    bodyParagraphs: splitParagraphs(bodyText),
  };
}

export function getModelEssayWordCount(
  text: string,
  examPart?: 'part1' | 'part2' | null,
  questionType?: 'q1' | 'q2' | null
): ModelEssayWordCountResult {
  const structure = parseModelEssayStructure(text, examPart, questionType);
  const wordCount = countWords(structure.bodyParagraphs.join(' '));

  return {
    ...structure,
    wordCount,
    withinTargetRange: wordCount >= TARGET_MIN_WORDS && wordCount <= TARGET_MAX_WORDS,
    withinHardLimit: wordCount <= HARD_MAX_WORDS,
  };
}

export function getModelEssayWordCountLimits(): {
  targetMin: number;
  targetMax: number;
  generationMin: number;
  hardMax: number;
} {
  return {
    targetMin: TARGET_MIN_WORDS,
    targetMax: TARGET_MAX_WORDS,
    generationMin: GENERATION_MIN_WORDS,
    hardMax: HARD_MAX_WORDS,
  };
}
