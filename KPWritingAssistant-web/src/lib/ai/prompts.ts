import fs from 'fs';
import path from 'path';

interface PromptsConfig {
  correction: {
    systemPrompt: string;
    userPromptTemplate: string;
  };
  modelEssay: {
    systemPrompt: string;
    levelDescriptions: {
      pass: string;
      good: string;
      excellent: string;
    };
    userPromptTemplate: string;
    highlightsSectionTemplate: string;
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

export function buildCorrectionUserPrompt(text: string): string {
  return config.correction.userPromptTemplate.replace('{{text}}', text);
}

export function buildModelEssayPrompt(
  originalText: string,
  highlights: string[],
  level: 'pass' | 'good' | 'excellent'
): string {
  const levelDescription = config.modelEssay.levelDescriptions[level];

  const highlightsSection =
    highlights.length > 0
      ? config.modelEssay.highlightsSectionTemplate.replace(
          '{{highlights}}',
          highlights.map((h) => `- ${h}`).join('\n')
        )
      : '';

  return config.modelEssay.userPromptTemplate
    .replace('{{originalText}}', originalText)
    .replace('{{highlightsSection}}', highlightsSection)
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
  historyNotes: string[]
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

  return config.modelEssay.userPromptTemplate
    .replace('{{originalText}}', originalText)
    .replace('{{highlightsSection}}', highlightsSection + preferenceSection + historySection)
    .replace('{{levelDescription}}', levelDescription);
}
