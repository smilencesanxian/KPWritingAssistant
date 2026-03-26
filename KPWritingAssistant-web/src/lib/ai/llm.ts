import OpenAI from 'openai';
import type { CorrectionResult, DetectTypeResult } from '@/types/ai';
import {
  getCorrectionSystemPrompt,
  getModelEssaySystemPrompt,
  buildCorrectionUserPrompt,
  buildModelEssayPrompt,
  buildDetectTypePrompt,
  buildRegenerateModelEssayPrompt,
} from './prompts';

const LLM_BASE_URL =
  process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'qwen-plus';

function createLLMClient(): OpenAI {
  return new OpenAI({
    baseURL: LLM_BASE_URL,
    apiKey: LLM_API_KEY,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function correctEssay(
  text: string,
  examPart?: string | null
): Promise<CorrectionResult> {
  const client = createLLMClient();
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await sleep(3000);
    }

    try {
      const response = await client.chat.completions.create({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: getCorrectionSystemPrompt(examPart) },
          {
            role: 'user',
            content: buildCorrectionUserPrompt(text, examPart),
          },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const result = JSON.parse(content) as CorrectionResult;

      // Validate required fields
      if (
        !result.scores ||
        typeof result.scores.total !== 'number' ||
        !Array.isArray(result.error_annotations) ||
        !Array.isArray(result.highlights) ||
        !Array.isArray(result.error_summary)
      ) {
        throw new Error('Invalid response structure from LLM');
      }

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < 2) {
        console.warn(`LLM correction attempt ${attempt + 1} failed:`, lastError.message);
      }
    }
  }

  throw new Error(`作文批改失败，请稍后重试。${lastError ? `(${lastError.message})` : ''}`);
}

export async function generateModelEssay(
  originalText: string,
  highlights: string[],
  level: 'pass' | 'good' | 'excellent',
  collectedPhrases?: string[],
  examPart?: string | null,
  questionType?: string | null
): Promise<string> {
  const client = createLLMClient();

  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: getModelEssaySystemPrompt(examPart) },
      {
        role: 'user',
        content: buildModelEssayPrompt(originalText, highlights, level, collectedPhrases, examPart, questionType),
      },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('范文生成失败，请稍后重试。');
  }

  return content.trim();
}

export async function detectEssayType(
  essayOcrText: string,
  questionOcrText?: string
): Promise<DetectTypeResult> {
  const client = createLLMClient();

  try {
    const { system, user } = buildDetectTypePrompt(questionOcrText || '', essayOcrText);

    const response = await client.chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 512,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    // Parse JSON response
    let result: Partial<DetectTypeResult>;
    try {
      result = JSON.parse(content) as Partial<DetectTypeResult>;
    } catch {
      // If JSON parsing fails, return default values
      return getDefaultDetectTypeResult();
    }

    // Validate and set defaults for missing fields
    const validatedResult: DetectTypeResult = {
      exam_part: result.exam_part === 'part2' ? 'part2' : 'part1',
      question_type: result.question_type === 'q2' ? 'q2' : result.question_type === 'q1' ? 'q1' : null,
      essay_type_label: result.essay_type_label || (result.exam_part === 'part2' ? '文章' : '邮件'),
      topic: result.topic || '未知主题',
      confidence: result.confidence || 'low',
    };

    return validatedResult;
  } catch (err) {
    console.error('Detect type failed:', err);
    // Return default values on error
    return getDefaultDetectTypeResult();
  }
}

function getDefaultDetectTypeResult(): DetectTypeResult {
  return {
    exam_part: 'part1',
    question_type: null,
    essay_type_label: '邮件',
    topic: '未知主题',
    confidence: 'low',
  };
}

export async function regenerateModelEssay(
  originalText: string,
  highlights: string[],
  preferenceNotes: string,
  historyNotes: string[],
  examPart?: string | null,
  questionType?: string | null
): Promise<string> {
  const client = createLLMClient();

  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: getModelEssaySystemPrompt(examPart) },
      {
        role: 'user',
        content: buildRegenerateModelEssayPrompt(
          originalText,
          highlights,
          preferenceNotes,
          historyNotes,
          examPart,
          questionType
        ),
      },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('范文重新生成失败，请稍后重试。');
  }

  return content.trim();
}
