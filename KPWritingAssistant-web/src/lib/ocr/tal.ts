import crypto from 'crypto';
import type { OcrResult } from '@/types/ocr';

const TAL_OCR_URL = 'https://openai.100tal.com/aiimage/comeducation';

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
        pos: Array<{ x: number; y: number }>;
      }>;
    }>;
    hand_text?: Array<{
      poses: Array<{ x: number; y: number }>;
      texts: string[];
    }>;
    print_text?: Array<{
      poses: Array<{ x: number; y: number }>;
      texts: string;
    }>;
  };
}

/**
 * 生成好未来API签名
 * 签名算法: HmacSHA1
 * Secret: access_key_secret + "&"
 * 签名内容: URL参数 + request_body (JSON字符串)
 */
function generateSignature(
  urlParams: Record<string, string>,
  bodyParams: TalOcrRequestBody,
  accessKeySecret: string
): string {
  // 组合URL和Body参数
  const signParam: Record<string, string> = {
    request_body: JSON.stringify(bodyParams),
    ...urlParams,
  };

  // 构建待签名字符串 (按key排序后拼接)
  const sortedKeys = Object.keys(signParam).sort();
  const stringToSign = sortedKeys
    .map((key) => `${key}=${signParam[key]}`)
    .join('&');

  // 使用HmacSHA1计算签名
  const secret = `${accessKeySecret}&`;
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(stringToSign, 'utf-8');
  const signature = hmac.digest('base64');

  return signature;
}

/**
 * 格式化URL参数
 */
function buildUrlParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
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

  // 准备请求体参数
  const bodyParams: TalOcrRequestBody = {
    image_base64: imageBase64,
    function: 2, // 手写文字识别
    detect_direction: true,
    subject: 'liberat', // 文科
    textInImage: true,
  };

  // 准备URL参数 (用于签名)
  const timestamp = Date.now().toString();
  const signatureNonce = crypto.randomUUID();

  const urlParams: Record<string, string> = {
    access_key_id: accessKeyId,
    timestamp: timestamp,
    signature_nonce: signatureNonce,
  };

  // 生成签名
  const signature = generateSignature(urlParams, bodyParams, accessKeySecret);
  urlParams.signature = signature;

  // 构建完整URL
  const url = `${TAL_OCR_URL}?${buildUrlParams(urlParams)}`;

  // 发送请求
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyParams),
  });

  if (!response.ok) {
    throw new Error(`图片识别失败，请检查图片清晰度后重试`);
  }

  const data: TalOcrResponse = await response.json();

  // 检查返回码
  if (data.code !== 20000) {
    throw new Error(`图片识别失败：${data.msg || '未知错误'}`);
  }

  if (!data.data) {
    return { text: '', confidence: 0 };
  }

  // 提取识别文本
  // 优先使用 hand_text (手写文本)，如果没有则使用 result
  const lines: string[] = [];

  // 处理手写文本结果
  if (data.data.hand_text && data.data.hand_text.length > 0) {
    for (const item of data.data.hand_text) {
      if (item.texts && item.texts.length > 0) {
        // texts 是 top10 结果数组，取第一个
        lines.push(item.texts[0]);
      }
    }
  }

  // 如果没有手写文本，尝试使用通用result
  if (lines.length === 0 && data.data.result && data.data.result.length > 0) {
    for (const item of data.data.result) {
      if (item.char_info && item.char_info.length > 0) {
        // 合并字符为字符串
        const text = item.char_info.map((c) => c.char).join('');
        if (text) {
          lines.push(text);
        }
      }
    }
  }

  // 处理印刷文本结果 (备用)
  if (lines.length === 0 && data.data.print_text && data.data.print_text.length > 0) {
    for (const item of data.data.print_text) {
      if (item.texts) {
        lines.push(item.texts);
      }
    }
  }

  const text = lines.join('\n');

  // 好未来API没有直接返回置信度，使用固定值或根据结果数量估算
  const confidence = lines.length > 0 ? 0.85 : 0;

  return { text, confidence };
}
