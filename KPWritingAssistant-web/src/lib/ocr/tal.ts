import crypto from 'crypto';
import type { OcrResult } from '@/types/ocr';

const TAL_OCR_URL = 'https://openai.100tal.com/aiimage/comeducation';
const TAL_QPS_ERROR_CODE = 4011005;
const TAL_MAX_RETRIES = 2;
const TAL_RETRY_DELAY_MS = 1200;

let talRequestQueue: Promise<void> = Promise.resolve();

interface TalPoint {
  x: number;
  y: number;
}

interface TalOcrRequestBody {
  image_base64?: string;
  image_url?: string;
  function?: number;
  detect_direction?: boolean;
  subject?: string;
  textInImage?: boolean;
}

interface TalOcrResponse {
  code: number;
  msg: string;
  requestId: string;
  data?: {
    rotate?: number;
    result?: Array<{
      char_info?: Array<{
        char: string;
        pos: TalPoint[];
      }>;
    }>;
    hand_text?: Array<{
      poses: TalPoint[];
      texts: string[];
    }>;
    print_text?: Array<{
      poses: TalPoint[];
      texts: string;
    }>;
    single_box?: {
      row_text?: Array<{
        poses: TalPoint[];
        texts: string[];
      }>;
    };
  };
}

interface TalRequestParams {
  requestBody: string;
  url: string;
}

/**
 * 生成好未来API签名
 * 签名算法: HmacSHA1
 * Secret: access_key_secret + "&"
 * 签名内容: URL参数 + request_body (JSON字符串)
 * 所有参数按 key 升序排序后拼接
 */
function generateSignature(
  urlParams: Record<string, string>,
  requestBody: string,
  accessKeySecret: string
): string {
  const signParam: Record<string, string> = {
    access_key_id: urlParams.access_key_id,
    request_body: requestBody,
    signature_nonce: urlParams.signature_nonce,
    timestamp: urlParams.timestamp,
  };

  const stringToSign = Object.keys(signParam)
    .sort()
    .map((key) => `${key}=${signParam[key]}`)
    .join('&');

  const secret = `${accessKeySecret}&`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(stringToSign, 'utf-8');
  return hmac.digest('base64');
}

/**
 * 格式化URL参数
 */
function buildUrlParams(params: Record<string, string>): string {
  return Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function getPositionMetrics(points: TalPoint[] | undefined): {
  top: number;
  left: number;
  height: number;
} {
  if (!points || points.length === 0) {
    return { top: 0, left: 0, height: 0 };
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    top: Math.min(...ys),
    left: Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

function sortByReadingOrder<T>(
  items: T[],
  getPoints: (item: T) => TalPoint[] | undefined
): T[] {
  const withMetrics = items.map((item) => ({
    item,
    ...getPositionMetrics(getPoints(item)),
  }));
  const heights = withMetrics
    .map((entry) => entry.height)
    .filter((height) => height > 0);
  const averageHeight =
    heights.length > 0
      ? heights.reduce((sum, height) => sum + height, 0) / heights.length
      : 0;
  const lineThreshold = Math.max(averageHeight * 0.5, 8);

  return withMetrics
    .sort((left, right) => {
      if (Math.abs(left.top - right.top) <= lineThreshold) {
        return left.left - right.left;
      }

      return left.top - right.top;
    })
    .map((entry) => entry.item);
}

function collectHandText(
  items: NonNullable<TalOcrResponse['data']>['hand_text'] | undefined
): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  return sortByReadingOrder(items, (item) => item.poses)
    .map((item) => item.texts?.[0]?.trim() ?? '')
    .filter((text) => text.length > 0);
}

function collectResultText(
  items: NonNullable<TalOcrResponse['data']>['result'] | undefined
): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  return sortByReadingOrder(items, (item) => item.char_info?.flatMap((char) => char.pos))
    .map((item) => {
      const chars = sortByReadingOrder(item.char_info ?? [], (char) => char.pos);
      return chars.map((char) => char.char).join('').trim();
    })
    .filter((text) => text.length > 0);
}

function collectPrintText(
  items: NonNullable<TalOcrResponse['data']>['print_text'] | undefined
): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  return sortByReadingOrder(items, (item) => item.poses)
    .map((item) => item.texts?.trim() ?? '')
    .filter((text) => text.length > 0);
}

function collectSingleBoxText(
  items: NonNullable<NonNullable<TalOcrResponse['data']>['single_box']>['row_text'] | undefined
): string[] {
  if (!items || items.length === 0) {
    return [];
  }

  return sortByReadingOrder(items, (item) => item.poses)
    .map((item) => item.texts?.[0]?.trim() ?? '')
    .filter((text) => text.length > 0);
}

function pickFirstNonEmpty(candidates: string[][]): string[] {
  return candidates.find((candidate) => candidate.length > 0) ?? [];
}

function extractTextLines(data: NonNullable<TalOcrResponse['data']>): string[] {
  return pickFirstNonEmpty([
    collectHandText(data.hand_text),
    collectResultText(data.result),
    collectPrintText(data.print_text),
    collectSingleBoxText(data.single_box?.row_text),
  ]);
}

async function parseHttpError(response: Response): Promise<{
  code?: number;
  error: Error;
}> {
  try {
    const rawText = await response.text();
    if (!rawText) {
      return {
        error: new Error('图片识别失败，请检查图片清晰度后重试'),
      };
    }

    const parsed = JSON.parse(rawText) as Partial<TalOcrResponse>;
    if (parsed.msg) {
      return {
        code: typeof parsed.code === 'number' ? parsed.code : undefined,
        error: new Error(`图片识别失败：${parsed.msg}`),
      };
    }
  } catch {
    // ignore parse errors and use generic message below
  }

  return {
    error: new Error('图片识别失败，请检查图片清晰度后重试'),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function enqueueTalRequest<T>(task: () => Promise<T>): Promise<T> {
  const run = talRequestQueue.then(task, task);
  talRequestQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function sendTalRequest(
  url: string,
  requestBody: string,
  attempt = 0
): Promise<TalOcrResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  if (!response.ok) {
    const { code, error } = await parseHttpError(response);
    if (code === TAL_QPS_ERROR_CODE && attempt < TAL_MAX_RETRIES) {
      await sleep(TAL_RETRY_DELAY_MS * (attempt + 1));
      return sendTalRequest(url, requestBody, attempt + 1);
    }
    throw error;
  }

  return response.json();
}

function buildTalRequest(
  imageBase64: string,
  accessKeyId: string,
  accessKeySecret: string,
  functionType: number
): TalRequestParams {
  const bodyParams: TalOcrRequestBody = {
    image_base64: imageBase64,
    function: functionType,
    detect_direction: true,
    subject: 'liberat',
    textInImage: true,
  };
  const requestBody = JSON.stringify(bodyParams);
  const urlParams: Record<string, string> = {
    access_key_id: accessKeyId,
    signature_nonce: crypto.randomUUID(),
    timestamp: Date.now().toString(),
  };
  const signedUrlParams: Record<string, string> = {
    ...urlParams,
    signature: generateSignature(urlParams, requestBody, accessKeySecret),
  };

  return {
    requestBody,
    url: `${TAL_OCR_URL}?${buildUrlParams(signedUrlParams)}`,
  };
}

/**
 * 好未来OCR手写文字识别
 * 支持手写中文、手写英文、手写数字识别
 */
export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  const accessKeyId = process.env.TAL_ACCESS_KEY_ID;
  const accessKeySecret = process.env.TAL_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error('好未来 OCR 密钥未配置，请设置 TAL_ACCESS_KEY_ID 和 TAL_ACCESS_KEY_SECRET 环境变量');
  }

  const handwritingRequest = buildTalRequest(imageBase64, accessKeyId, accessKeySecret, 2);
  const handwritingData = await enqueueTalRequest(() =>
    sendTalRequest(handwritingRequest.url, handwritingRequest.requestBody)
  );

  if (handwritingData.code !== 20000) {
    throw new Error(`图片识别失败：${handwritingData.msg || '未知错误'}`);
  }

  const handwritingLines = handwritingData.data
    ? extractTextLines(handwritingData.data)
    : [];
  let lines = handwritingLines;

  if (lines.length === 0) {
    const generalRequest = buildTalRequest(
      imageBase64,
      accessKeyId,
      accessKeySecret,
      0
    );
    const generalData = await enqueueTalRequest(() =>
      sendTalRequest(generalRequest.url, generalRequest.requestBody)
    );
    if (generalData.code !== 20000) {
      throw new Error(`图片识别失败：${generalData.msg || '未知错误'}`);
    }

    lines = generalData.data ? extractTextLines(generalData.data) : [];
  }
  const text = lines.join('\n');

  const confidence = lines.length > 0 ? 0.85 : 0;

  return { text, confidence };
}
