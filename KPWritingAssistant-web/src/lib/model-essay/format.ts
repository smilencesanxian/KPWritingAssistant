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
const HARD_MAX_WORDS = 120;
const TITLE_MAX_WORDS = 10;

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

function splitLongParagraphForReadability(paragraph: string): string[] {
  const words = countWords(paragraph);
  if (words < 80) {
    return [paragraph];
  }

  const sentences = paragraph
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length < 3) {
    return [paragraph];
  }

  const targetWords = Math.ceil(words / 2);
  let accumulated = 0;
  let splitIndex = 0;

  for (let index = 0; index < sentences.length - 1; index += 1) {
    accumulated += countWords(sentences[index]);
    if (accumulated >= targetWords) {
      splitIndex = index + 1;
      break;
    }
  }

  if (splitIndex === 0) {
    splitIndex = Math.ceil(sentences.length / 2);
  }

  return [
    sentences.slice(0, splitIndex).join(' ').trim(),
    sentences.slice(splitIndex).join(' ').trim(),
  ].filter(Boolean);
}

function isLikelyTitle(line: string): boolean {
  if (!TITLE_RE.test(line)) {
    return false;
  }

  const words = countWords(line);
  if (words === 0 || words > TITLE_MAX_WORDS) {
    return false;
  }

  return line.length <= 80;
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
  } else if (examPart === 'part2' && questionType === 'q1' && lines.length > 0 && isLikelyTitle(lines[0])) {
    titleLine = lines[0];
    const titleIndex = nonEmptyLineIndexes[0] ?? 0;
    bodyText = rawLines.slice(titleIndex + 1).join('\n');
  }

  let bodyParagraphs = splitParagraphs(bodyText);
  if (bodyParagraphs.length === 1) {
    bodyParagraphs = splitLongParagraphForReadability(bodyParagraphs[0]);
  }

  return {
    normalizedText,
    titleLine,
    salutationLine,
    signoffLines,
    bodyParagraphs,
  };
}

export function normalizeModelEssayFormatting(
  text: string,
  examPart?: 'part1' | 'part2' | null,
  questionType?: 'q1' | 'q2' | null
): string {
  const structure = parseModelEssayStructure(text, examPart, questionType);
  const blocks: string[] = [];

  if (structure.titleLine) {
    blocks.push(structure.titleLine.trim());
  }

  if (structure.salutationLine) {
    blocks.push(structure.salutationLine.trim());
  }

  blocks.push(...structure.bodyParagraphs.map((item) => item.trim()).filter(Boolean));

  if (structure.signoffLines.length > 0) {
    blocks.push(...structure.signoffLines.map((item) => item.trim()).filter(Boolean));
  }

  return blocks.join('\n\n').trim();
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
