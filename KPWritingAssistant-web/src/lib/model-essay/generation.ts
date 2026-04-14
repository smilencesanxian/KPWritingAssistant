import { getModelEssayWordCount, getModelEssayWordCountLimits } from './format';

type EssayGenerator = (additionalRequirements: string) => Promise<string>;

const MIN_ACCEPTABLE_WORDS = 90;
const MAX_ATTEMPTS = 3;

function buildRetryRequirements(wordCount: number): string {
  const { targetMin, targetMax, hardMax } = getModelEssayWordCountLimits();

  if (wordCount > hardMax) {
    return `上一版正文共有 ${wordCount} 词，严重超限。请大幅压缩内容，只保留最关键的信息，正文必须控制在 ${targetMin}-${targetMax} 词之间，绝对不能超过 ${hardMax} 词。`;
  }

  if (wordCount > targetMax) {
    return `上一版正文共有 ${wordCount} 词，略微超限。请删减冗余表达，正文压缩到 ${targetMin}-${targetMax} 词之间。`;
  }

  return `上一版正文只有 ${wordCount} 词，内容偏少。请补足必要细节，但正文仍必须控制在 ${targetMin}-${targetMax} 词之间。`;
}

export async function generateValidatedModelEssay(
  generator: EssayGenerator,
  examPart?: 'part1' | 'part2' | null,
  questionType?: 'q1' | 'q2' | null
): Promise<string> {
  let additionalRequirements = '';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const content = await generator(additionalRequirements);
    const metrics = getModelEssayWordCount(content, examPart, questionType);

    if (metrics.withinHardLimit && metrics.wordCount >= MIN_ACCEPTABLE_WORDS) {
      return content;
    }

    additionalRequirements = buildRetryRequirements(metrics.wordCount);
  }

  throw new Error('生成的范文未满足字数约束，请稍后重试');
}
