import crypto from 'crypto';
import type { OcrResult } from '@/types/ocr';

const HOST = 'ocr.tencentcloudapi.com';
const SERVICE = 'ocr';
const REGION = 'ap-guangzhou';
const ACTION = 'GeneralHandwritingOCR';
const VERSION = '2018-11-19';

function sha256Hex(message: string | Buffer): string {
  return crypto.createHash('sha256').update(message).digest('hex');
}

function hmacSha256(key: Buffer, message: string): Buffer {
  return crypto.createHmac('sha256', key).update(message).digest();
}

function sign(secretKey: string, date: string, service: string, stringToSign: string): string {
  const kDate = hmacSha256(Buffer.from('TC3' + secretKey), date);
  const kService = hmacSha256(kDate, service);
  const kSigning = hmacSha256(kService, 'tc3_request');
  return crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
}

interface TencentPolygonPoint {
  X: number;
  Y: number;
}

interface TencentTextDetection {
  DetectedText: string;
  Confidence: number;
  Polygon?: TencentPolygonPoint[];
}

interface TencentOcrResponse {
  Response: {
    TextDetections?: TencentTextDetection[];
    Error?: { Code: string; Message: string };
  };
}

export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error('腾讯云 OCR 密钥未配置，请设置 TENCENT_SECRET_ID 和 TENCENT_SECRET_KEY 环境变量');
  }

  const now = Math.floor(Date.now() / 1000);
  const date = new Date(now * 1000).toISOString().slice(0, 10);

  const payload = JSON.stringify({ ImageBase64: imageBase64 });
  const payloadHash = sha256Hex(payload);

  const canonicalHeaders = `content-type:application/json\nhost:${HOST}\nx-tc-action:${ACTION.toLowerCase()}\n`;
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${now}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const signature = sign(secretKey, date, SERVICE, stringToSign);
  const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${HOST}`, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json',
      Host: HOST,
      'X-TC-Action': ACTION,
      'X-TC-Region': REGION,
      'X-TC-Timestamp': String(now),
      'X-TC-Version': VERSION,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`图片识别失败，请检查图片清晰度后重试`);
  }

  const data: TencentOcrResponse = await response.json();

  if (data.Response.Error) {
    throw new Error(`图片识别失败：${data.Response.Error.Message}`);
  }

  const detections = data.Response.TextDetections;
  if (!detections || detections.length === 0) {
    return { text: '', confidence: 0 };
  }

  // 按阅读顺序排序：先按 Y 轴（行），再按 X 轴（列）
  // 用多边形最小 Y 作为行基准，最小 X 作为列基准
  const withPos = detections.map((d) => {
    const ys = d.Polygon?.map((p) => p.Y) ?? [0];
    const xs = d.Polygon?.map((p) => p.X) ?? [0];
    return { d, top: Math.min(...ys), left: Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  });

  // 对齐阈值取所有文本块平均高度的 50%，在此范围内视为同一行
  const avgHeight = withPos.reduce((sum, b) => sum + b.height, 0) / withPos.length;
  const lineThreshold = avgHeight * 0.5;

  withPos.sort((a, b) => {
    if (Math.abs(a.top - b.top) <= lineThreshold) {
      return a.left - b.left; // 同一行：从左到右
    }
    return a.top - b.top; // 不同行：从上到下
  });

  const text = withPos.map((b) => b.d.DetectedText).join('\n');
  const confidence =
    detections.reduce((sum, d) => sum + d.Confidence, 0) / detections.length / 100;

  return { text, confidence };
}
