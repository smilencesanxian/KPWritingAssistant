import type { OcrResult } from '@/types/ocr';
import { OCR_USER_PROMPT } from '@/lib/ai/prompts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicContent {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContent[];
  error?: { message: string };
}

export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Claude OCR 密钥未配置，请设置 ANTHROPIC_API_KEY 环境变量');
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: OCR_USER_PROMPT,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude OCR 调用失败：${err}`);
  }

  const data: AnthropicResponse = await response.json();

  if (data.error) {
    throw new Error(`Claude OCR 失败：${data.error.message}`);
  }

  const text = data.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');

  return { text, confidence: 1 };
}
