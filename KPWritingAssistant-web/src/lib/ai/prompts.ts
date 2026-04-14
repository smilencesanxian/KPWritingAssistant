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

function getModelEssayWordCountGuidance(examPart?: string | null, questionType?: string | null): string {
  if (examPart === 'part1') {
    return [
      '【字数统计口径】',
      '- 生成目标：正文建议控制在 100-110 词左右。',
      '- 统计方式：只统计正文内容，不计称呼和落款。',
      '- 结构要求：邮件正文保持自然分段，不要把称呼或落款混入正文统计。',
    ].join('\n');
  }

  if (examPart === 'part2' && questionType === 'q2') {
    return [
      '【字数统计口径】',
      '- 生成目标：故事正文建议控制在 100-110 词左右。',
      '- 统计方式：全文都计入词数，不需要标题。',
      '- 结构要求：直接写故事正文即可，不要额外添加标题。',
    ].join('\n');
  }

  return [
    '【字数统计口径】',
    '- 生成目标：文章正文建议控制在 100-110 词左右。',
    '- 统计方式：只统计正文内容，不计标题。',
    '- 结构要求：标题单独一行，标题不计入正文词数。',
  ].join('\n');
}

/**
 * Returns the correction system prompt for the given exam part.
 * For Part 1: prepends part1ExtraGuidance (detailed criteria) before the base JSON-format prompt.
 * For Part 2: prepends part2ExtraGuidance before the base JSON-format prompt.
 * Falls back to the base systemPrompt if no extra guidance is configured.
 */
function getPart2QuestionTypeGuidance(questionType?: string | null): string {
  if (questionType === 'q2') {
    return [
      '【Part 2 Story 额外要求】',
      '- 当前作文题型明确为故事续写（Story），不得按 Article 标准批改。',
      '- step2 必须聚焦故事衔接与文体效果，检查是否与给定开头句自然衔接、是否具备叙事感。',
      '- step3 必须聚焦情节推进与段落组织，检查开端-发展-结局是否完整。',
      '- step5 必须输出亮点词句分析，不能输出语法准确性检查、改写全文或泛泛总结。',
      '- 语法、拼写、时态等错误只能放到 step4 中，不得挤占 step5/step6 的语义。',
    ].join('\n');
  }

  return [
    '【Part 2 Article 额外要求】',
    '- 当前作文题型明确为文章（Article），不得按 Story 标准批改。',
    '- step2 必须聚焦文章文体与读者意识，检查标题、开头吸引力、观点表达是否符合文章体裁。',
    '- step3 必须聚焦问题回应完整度与段落组织，检查题目中的问题是否逐一回答。',
    '- step5 必须输出亮点词句分析，不能输出语法准确性检查、改写全文或泛泛总结。',
    '- 语法、拼写、时态等错误只能放到 step4 中。',
  ].join('\n');
}

export function getCorrectionSystemPrompt(
  examPart?: string | null,
  questionType?: string | null
): string {
  const baseJsonFormat = config.correction.systemPrompt;
  if (examPart === 'part2') {
    const extra = config.correction.part2ExtraGuidance;
    const questionTypeGuidance = getPart2QuestionTypeGuidance(questionType);
    return extra
      ? `${extra}\n\n${questionTypeGuidance}\n\n以下是批改结果的输出格式要求（必须严格遵守）：\n\n${baseJsonFormat}`
      : `${questionTypeGuidance}\n\n${baseJsonFormat}`;
  }
  const extra = config.correction.part1ExtraGuidance;
  return extra ? `${extra}\n\n以下是批改结果的输出格式要求（必须严格遵守）：\n\n${baseJsonFormat}` : baseJsonFormat;
}

/** Returns the model essay system prompt for the given exam part */
export function getModelEssaySystemPrompt(
  examPart?: string | null,
  questionType?: string | null
): string {
  const wordCountGuidance = getModelEssayWordCountGuidance(examPart, questionType);
  if (examPart === 'part2') {
    return `${config.modelEssay.part2SystemPrompt || config.modelEssay.systemPrompt}\n\n${wordCountGuidance}`;
  }
  // Log warning if exam_part is missing or invalid
  if (examPart && examPart !== 'part1') {
    console.warn(`[Prompts] Unexpected exam_part "${examPart}", using Part1 prompt`);
  }
  return `${config.modelEssay.part1SystemPrompt || config.modelEssay.systemPrompt}\n\n${wordCountGuidance}`;
}

function getCorrectionQuestionTypeHint(questionType?: string | null): string {
  if (questionType === 'q2') {
    return '\n\n【题型确认】这是一篇 Part 2 Story（故事续写）。请严格按 Story 评分标准批改，并确保 step5 输出亮点分析。';
  }
  if (questionType === 'q1') {
    return '\n\n【题型确认】这是一篇 Part 2 Article（文章写作）。请严格按 Article 评分标准批改，并确保 step5 输出亮点分析。';
  }
  return '';
}

export function buildCorrectionUserPrompt(
  text: string,
  examPart?: string | null,
  questionType?: string | null
): string {
  if (examPart === 'part2') {
    return (config.correction.part2UserPromptTemplate || config.correction.userPromptTemplate)
      .replace('{{text}}', text) + getCorrectionQuestionTypeHint(questionType);
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
  questionType?: string | null,
  additionalRequirements?: string
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
  const additionalRequirementsSection = additionalRequirements
    ? `\n\n【额外硬性要求】\n${additionalRequirements}`
    : '';
  const wordCountGuidanceSection = `\n\n${getModelEssayWordCountGuidance(examPart, questionType)}`;

  if (examPart === 'part2') {
    const template = config.modelEssay.part2UserPromptTemplate || config.modelEssay.userPromptTemplate;
    return template
      .replace('{{originalText}}', originalText)
      .replace('{{questionTypeDescription}}', getQuestionTypeDescription(questionType))
      .replace('{{highlightsSection}}', highlightsSection)
      .replace('{{collectedPhrasesSection}}', `${collectedPhrasesSection}${additionalRequirementsSection}${wordCountGuidanceSection}`)
      .replace('{{levelDescription}}', levelDescription);
  }

  return config.modelEssay.userPromptTemplate
    .replace('{{originalText}}', originalText)
    .replace('{{highlightsSection}}', highlightsSection)
    .replace('{{collectedPhrasesSection}}', `${collectedPhrasesSection}${additionalRequirementsSection}${wordCountGuidanceSection}`)
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
  collectedPhrases: string[],
  preferenceNotes: string,
  historyNotes: string[],
  examPart?: string | null,
  questionType?: string | null,
  additionalRequirements?: string
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
  const additionalRequirementsSection = additionalRequirements
    ? `\n【额外硬性要求】\n${additionalRequirements}`
    : '';
  const wordCountGuidanceSection = `\n${getModelEssayWordCountGuidance(examPart, questionType)}`;
  const collectedPhrasesSection =
    collectedPhrases.length > 0
      ? config.modelEssay.collectedPhrasesSectionTemplate.replace(
          '{{collectedPhrases}}',
          collectedPhrases.map((phrase) => `- ${phrase}`).join('\n')
        )
      : '';

  const extraSections =
    highlightsSection + preferenceSection + historySection + additionalRequirementsSection;

  if (examPart === 'part2') {
    const template = config.modelEssay.part2UserPromptTemplate || config.modelEssay.userPromptTemplate;
    return template
      .replace('{{originalText}}', originalText)
      .replace('{{questionTypeDescription}}', getQuestionTypeDescription(questionType))
      .replace('{{highlightsSection}}', `${extraSections}${wordCountGuidanceSection}`)
      .replace('{{collectedPhrasesSection}}', collectedPhrasesSection)
      .replace('{{levelDescription}}', levelDescription);
  }

  return config.modelEssay.userPromptTemplate
    .replace('{{originalText}}', originalText)
    .replace('{{highlightsSection}}', `${extraSections}${wordCountGuidanceSection}`)
    .replace('{{collectedPhrasesSection}}', collectedPhrasesSection)
    .replace('{{levelDescription}}', levelDescription);
}
