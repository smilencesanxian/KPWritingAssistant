import {
  getModelEssayWordCount,
  getModelEssayWordCountLimits,
  normalizeModelEssayFormatting,
} from './format';

type EssayGenerator = (additionalRequirements: string) => Promise<string>;

const DEFAULT_MAX_ATTEMPTS = 3;

function getMaxAttempts(): number {
  const raw = Number.parseInt(process.env.MODEL_ESSAY_MAX_ATTEMPTS ?? '', 10);
  if (!Number.isFinite(raw) || raw < 1) {
    return DEFAULT_MAX_ATTEMPTS;
  }
  return raw;
}

function buildRetryRequirements(wordCount: number): string {
  const { targetMin, targetMax, generationMin, hardMax } = getModelEssayWordCountLimits();

  if (wordCount > hardMax) {
    return `上一版正文共有 ${wordCount} 词，明显超出建议范围。请大幅压缩内容，只保留最关键的信息，正文请尽量回到 ${targetMin}-${targetMax} 词左右。`;
  }

  if (wordCount > targetMax) {
    return `上一版正文共有 ${wordCount} 词，略微超出目标范围。请删减冗余表达，正文尽量压缩到 ${targetMin}-${targetMax} 词左右。`;
  }

  if (wordCount < generationMin) {
    return `上一版正文只有 ${wordCount} 词，内容偏少。请补足必要细节，正文请尽量写到 ${targetMin}-${targetMax} 词左右。`;
  }

  return '';
}

export async function generateValidatedModelEssay(
  generator: EssayGenerator,
  examPart?: 'part1' | 'part2' | null,
  questionType?: 'q1' | 'q2' | null
): Promise<string> {
  let additionalRequirements = '';
  let lastContent = '';
  const maxAttempts = getMaxAttempts();
  const { generationMin } = getModelEssayWordCountLimits();

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const content = await generator(additionalRequirements);
    const normalizedContent = normalizeModelEssayFormatting(content, examPart, questionType);
    if (normalizedContent.trim()) {
      lastContent = normalizedContent;
    }

    const metrics = getModelEssayWordCount(normalizedContent, examPart, questionType);

    if (metrics.withinHardLimit && metrics.wordCount >= generationMin) {
      return normalizedContent;
    }

    additionalRequirements = buildRetryRequirements(metrics.wordCount);
  }

  if (lastContent) {
    return lastContent;
  }

  throw new Error('生成范文失败，请稍后重试');
}
