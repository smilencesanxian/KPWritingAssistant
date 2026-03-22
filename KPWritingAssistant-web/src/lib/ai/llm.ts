import OpenAI from 'openai';
import type { CorrectionResult } from '@/types/ai';
import {
  PET_CORRECTION_SYSTEM_PROMPT,
  MODEL_ESSAY_SYSTEM_PROMPT,
  buildCorrectionUserPrompt,
  buildModelEssayPrompt,
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

export async function correctEssay(text: string): Promise<CorrectionResult> {
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
          { role: 'system', content: PET_CORRECTION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildCorrectionUserPrompt(text),
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
  level: 'pass' | 'good' | 'excellent'
): Promise<string> {
  const client = createLLMClient();

  const response = await client.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: MODEL_ESSAY_SYSTEM_PROMPT },
      { role: 'user', content: buildModelEssayPrompt(originalText, highlights, level) },
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
