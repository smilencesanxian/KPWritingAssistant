import type { OcrResult } from '@/types/ocr';

const BAIDU_TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const BAIDU_HANDWRITING_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting';

interface BaiduTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface BaiduWordsResult {
  words: string;
  probability?: {
    average: number;
  };
}

interface BaiduOcrResponse {
  words_result: BaiduWordsResult[];
  words_result_num: number;
  error_code?: number;
  error_msg?: string;
}

// Simple in-memory cache for the access token
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const apiKey = process.env.BAIDU_OCR_API_KEY;
  const secretKey = process.env.BAIDU_OCR_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('百度 OCR API 密钥未配置，请设置 BAIDU_OCR_API_KEY 和 BAIDU_OCR_SECRET_KEY 环境变量');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: secretKey,
  });

  const response = await fetch(`${BAIDU_TOKEN_URL}?${params.toString()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`获取百度 OCR Token 失败：HTTP ${response.status}`);
  }

  const data: BaiduTokenResponse = await response.json();

  if (data.error) {
    throw new Error(`获取百度 OCR Token 失败：${data.error_description || data.error}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch {
    throw new Error('图片识别失败，请检查 OCR 服务配置后重试');
  }

  const body = new URLSearchParams({
    image: imageBase64,
  });

  const response = await fetch(`${BAIDU_HANDWRITING_URL}?access_token=${accessToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`图片识别失败，请检查图片清晰度后重试`);
  }

  const data: BaiduOcrResponse = await response.json();

  if (data.error_code) {
    throw new Error(`图片识别失败，请检查图片清晰度后重试`);
  }

  if (!data.words_result || data.words_result.length === 0) {
    return { text: '', confidence: 0 };
  }

  // Merge all lines with newline separator
  const text = data.words_result.map((item) => item.words).join('\n');

  // Calculate average confidence across all words
  const confidenceValues = data.words_result
    .map((item) => item.probability?.average ?? 1)
    .filter((v) => v > 0);
  const confidence =
    confidenceValues.length > 0
      ? confidenceValues.reduce((sum, v) => sum + v, 0) / confidenceValues.length
      : 1;

  return { text, confidence };
}
