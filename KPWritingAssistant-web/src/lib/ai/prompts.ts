import fs from 'fs';
import path from 'path';

interface PromptsConfig {
  correction: {
    systemPrompt: string;
    part1ExtraGuidance?: string;
    part2ExtraGuidance?: string;
    userPromptTemplate: string;
    part2UserPromptTemplate?: string;
  };
  modelEssay: {
    systemPrompt: string;
    part1SystemPrompt?: string;
    part2SystemPrompt?: string;
    levelDescriptions: {
      pass: string;
      good: string;
      excellent: string;
    };
    userPromptTemplate: string;
    part2UserPromptTemplate?: string;
    highlightsSectionTemplate: string;
    collectedPhrasesSectionTemplate: string;
  };
  ocr: {
    userPrompt: string;
  };
  detectType: {
    systemPrompt: string;
    userPromptTemplate: string;
  };
}

function loadPromptsConfig(): PromptsConfig {
  const configPath = path.join(process.cwd(), 'src/config/prompts.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as PromptsConfig;
}

// Load once at module init (server-side only)
const config = loadPromptsConfig();

export const PET_CORRECTION_SYSTEM_PROMPT = config.correction.systemPrompt;

export const MODEL_ESSAY_SYSTEM_PROMPT = config.modelEssay.systemPrompt;

export const OCR_USER_PROMPT = config.ocr.userPrompt;

export const DETECT_TYPE_SYSTEM_PROMPT = config.detectType.systemPrompt;

/**
 * Returns the correction system prompt for the given exam part.
 * For Part 1: prepends part1ExtraGuidance (detailed criteria) before the base JSON-format prompt.
 * For Part 2: prepends part2ExtraGuidance before the base JSON-format prompt.
 * Falls back to the base systemPrompt if no extra guidance is configured.
 */
export function getCorrectionSystemPrompt(examPart?: string | null): string {
  const baseJsonFormat = config.correction.systemPrompt;
  if (examPart === 'part2') {
    const extra = config.correction.part2ExtraGuidance;
    return extra ? `${extra}\n\n以下是批改结果的输出格式要求（必须严格遵守）：\n\n${baseJsonFormat}` : baseJsonFormat;
  }
  const extra = config.correction.part1ExtraGuidance;
  return extra ? `${extra}\n\n以下是批改结果的输出格式要求（必须严格遵守）：\n\n${baseJsonFormat}` : baseJsonFormat;
}

/** Returns the model essay system prompt for the given exam part */
export function getModelEssaySystemPrompt(examPart?: string | null): string {
  if (examPart === 'part2') {
    return config.modelEssay.part2SystemPrompt || config.modelEssay.systemPrompt;
  }
  // Log warning if exam_part is missing or invalid
  if (examPart && examPart !== 'part1') {
    console.warn(`[Prompts] Unexpected exam_part "${examPart}", using Part1 prompt`);
  }
  return config.modelEssay.part1SystemPrompt || config.modelEssay.systemPrompt;
}

export function buildCorrectionUserPrompt(text: string, examPart?: string | null): string {
  if (examPart === 'part2') {
    return (config.correction.part2UserPromptTemplate || config.correction.userPromptTemplate).replace('{{text}}', text);
  }
  return config.correction.userPromptTemplate.replace('{{text}}', text);
}

/** Returns a human-readable description of the question type for Part 2 */
function getQuestionTypeDescription(questionType?: string | null): string {
  if (questionType === 'q2') return '故事（Story）——根据给定开头句续写完整故事';
  return '文章（Article）——根据题目给出的主题和问题写一篇表达个人观点的文章';
}

export function buildModelEssayPrompt(
  originalText: string,
  highlights: string[],
  level: 'pass' | 'good' | 'excellent',
  collectedPhrases?: string[],
  examPart?: string | null,
  questionType?: string | null
): string {
  const levelDescription = config.modelEssay.levelDescriptions[level];

  const highlightsSection =
    highlights.length > 0
      ? config.modelEssay.highlightsSectionTemplate.replace(
          '{{highlights}}',
          highlights.map((h) => `- ${h}`).join('\n')
        )
      : '';

  const collectedPhrasesSection =
    collectedPhrases && collectedPhrases.length > 0
      ? config.modelEssay.collectedPhrasesSectionTemplate.replace(
          '{{collectedPhrases}}',
          collectedPhrases.map((p) => `- ${p}`).join('\n')
        )
      : '';

  if (examPart === 'part2') {
    const template = config.modelEssay.part2UserPromptTemplate || config.modelEssay.userPromptTemplate;
    return template
      .replace('{{originalText}}', originalText)
      .replace('{{questionTypeDescription}}', getQuestionTypeDescription(questionType))
      .replace('{{highlightsSection}}', highlightsSection)
      .replace('{{collectedPhrasesSection}}', collectedPhrasesSection)
      .replace('{{levelDescription}}', levelDescription);
  }

  return config.modelEssay.userPromptTemplate
    .replace('{{originalText}}', originalText)
    .replace('{{highlightsSection}}', highlightsSection)
    .replace('{{collectedPhrasesSection}}', collectedPhrasesSection)
    .replace('{{levelDescription}}', levelDescription);
}

export function buildDetectTypePrompt(
  questionOcrText: string,
  essayOcrText: string
): { system: string; user: string } {
  const questionSection = questionOcrText
    ? `【题目内容】\n${questionOcrText}`
    : '';
  const essaySection = `【作文内容】\n${essayOcrText}`;

  const userPrompt = config.detectType.userPromptTemplate
    .replace('{{questionSection}}', questionSection)
    .replace('{{essaySection}}', essaySection);

  return {
    system: config.detectType.systemPrompt,
    user: userPrompt,
  };
}

export function buildRegenerateModelEssayPrompt(
  originalText: string,
  highlights: string[],
  preferenceNotes: string,
  historyNotes: string[],
  examPart?: string | null,
  questionType?: string | null
): string {
  const levelDescription = config.modelEssay.levelDescriptions.excellent;

  const highlightsSection =
    highlights.length > 0
      ? config.modelEssay.highlightsSectionTemplate.replace(
          '{{highlights}}',
          highlights.map((h) => `- ${h}`).join('\n')
        )
      : '';

  const preferenceSection = preferenceNotes
    ? `\n【用户本次偏好要求】\n${preferenceNotes}`
    : '';

  const historySection =
    historyNotes.length > 0
      ? `\n【用户历史偏好（参考）】\n${historyNotes.map((n) => `- ${n}`).join('\n')}`
      : '';

  const extraSections = highlightsSection + preferenceSection + historySection;

  if (examPart === 'part2') {
    const template = config.modelEssay.part2UserPromptTemplate || config.modelEssay.userPromptTemplate;
    return template
      .replace('{{originalText}}', originalText)
      .replace('{{questionTypeDescription}}', getQuestionTypeDescription(questionType))
      .replace('{{highlightsSection}}', extraSections)
      .replace('{{collectedPhrasesSection}}', '')
      .replace('{{levelDescription}}', levelDescription);
  }

  return config.modelEssay.userPromptTemplate
    .replace('{{originalText}}', originalText)
    .replace('{{highlightsSection}}', extraSections)
    .replace('{{collectedPhrasesSection}}', '')
    .replace('{{levelDescription}}', levelDescription);
}
