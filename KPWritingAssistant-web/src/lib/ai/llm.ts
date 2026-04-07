import OpenAI from 'openai';
import type { CorrectionResult, DetectTypeResult, CorrectionScores } from '@/types/ai';
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

/** 清理 LLM 输出中残留的 Markdown 格式符号（**bold**、*italic*、# 标题等） */
export function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

function createLLMClient(): OpenAI {
  return new OpenAI({
    baseURL: LLM_BASE_URL,
    apiKey: LLM_API_KEY,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract scores from the new structured format (scoring_overview)
 * or fallback to legacy format (scores)
 */
function extractScores(result: CorrectionResult): CorrectionScores {
  // Try new format first (scoring_overview)
  if (result.scoring_overview) {
    const so = result.scoring_overview;
    return {
      content: so.content?.score ?? 0,
      communication: so.communication?.score ?? 0,
      organization: so.organisation?.score ?? so.language?.score ?? 0, // fallback for compatibility
      language: so.language?.score ?? 0,
      total: (so.content?.score ?? 0) + (so.communication?.score ?? 0) +
             (so.organisation?.score ?? 0) + (so.language?.score ?? 0),
    };
  }

  // Fallback to legacy format
  if (result.scores) {
    return result.scores;
  }

  // Default fallback
  return {
    content: 0,
    communication: 0,
    organization: 0,
    language: 0,
    total: 0,
  };
}

/**
 * Validate the correction result structure
 * Supports both new structured format (v1.2.1) and legacy format (v1.2.0)
 */
function validateCorrectionResult(result: CorrectionResult): boolean {
  // Check for new structured format (v1.2.1)
  if (result.scoring_overview &&
    typeof result.scoring_overview.content?.score === 'number' &&
    typeof result.scoring_overview.communication?.score === 'number' &&
    typeof result.scoring_overview.language?.score === 'number' &&
    Array.isArray(result.improvement_suggestions) &&
    Array.isArray(result.highlights)) {
    return true;
  }

  // Check for legacy format (v1.2.0)
  if (result.scores &&
    typeof result.scores.total === 'number' &&
    Array.isArray(result.error_annotations) &&
    Array.isArray(result.highlights) &&
    Array.isArray(result.error_summary)) {
    return true;
  }

  return false;
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

      // Validate required fields (supports both old and new formats)
      if (!validateCorrectionResult(result)) {
        throw new Error('Invalid response structure from LLM');
      }

      // Ensure scores are populated for backward compatibility
      const scores = extractScores(result);
      result.scores = scores;

      // For new format, populate legacy fields for backward compatibility
      if (result.scoring_overview) {
        // Populate overall_comment from step6 if not present
        if (!result.overall_comment && result.correction_steps?.step6) {
          result.overall_comment = result.correction_steps.step6;
        }

        // Populate legacy improvement_suggestions if not present
        if (!result.improvement_suggestions && Array.isArray(result.improvement_suggestions)) {
          // Already in new format, convert to string for backward compatibility
          const suggestions = result.improvement_suggestions as Array<{ icon: string; title: string; detail: string }>;
          result.improvement_suggestions = suggestions
            .map(s => `${s.icon} ${s.title}: ${s.detail}`)
            .join('\n') as unknown as string;
        }

        // Ensure error_annotations array exists
        if (!result.error_annotations) {
          result.error_annotations = [];
        }

        // Ensure error_summary array exists
        if (!result.error_summary) {
          result.error_summary = [];
        }
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
    max_tokens: 220,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('范文生成失败，请稍后重试。');
  }

  return cleanMarkdown(content);
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
    max_tokens: 220,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('范文重新生成失败，请稍后重试。');
  }

  return cleanMarkdown(content);
}
