import type { OcrResult } from '@/types/ocr';

export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER ?? 'baidu';

  switch (provider) {
    case 'tencent':
      return (await import('./tencent')).recognizeHandwriting(imageBase64);
    case 'claude':
      return (await import('./claude')).recognizeHandwriting(imageBase64);
    default:
      return (await import('./baidu')).recognizeHandwriting(imageBase64);
  }
}

/**
 * 清洗OCR文本，过滤拍照App产生的噪音文字
 * 如：'3张'、'2页'、'第1张'、'共5张'等
 */
export function cleanOcrText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 过滤 '共X张' 格式（先处理，避免残留'共'字）
  cleaned = cleaned.replace(/共\d+张/g, '');

  // 过滤 '第X张' 格式（先处理，避免残留'第'字）
  cleaned = cleaned.replace(/第\d+张/g, '');

  // 过滤 '共X页' 格式
  cleaned = cleaned.replace(/共\d+页/g, '');

  // 过滤 '第X页' 格式
  cleaned = cleaned.replace(/第\d+页/g, '');

  // 过滤纯数字+'张'的噪音
  cleaned = cleaned.replace(/\d+张/g, '');

  // 过滤纯数字+'页'的噪音
  cleaned = cleaned.replace(/\d+页/g, '');

  // 过滤连续超过3个的空白行，压缩为最多2个换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 去除首尾空白
  cleaned = cleaned.trim();

  return cleaned;
}
