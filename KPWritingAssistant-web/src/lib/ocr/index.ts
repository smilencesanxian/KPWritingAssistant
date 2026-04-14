import type { OcrResult } from '@/types/ocr';

export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER ?? 'baidu';

  switch (provider) {
    case 'tencent':
      return (await import('./tencent')).recognizeHandwriting(imageBase64);
    case 'claude':
      return (await import('./claude')).recognizeHandwriting(imageBase64);
    case 'tal':
      return (await import('./tal')).recognizeHandwriting(imageBase64);
    default:
      return (await import('./baidu')).recognizeHandwriting(imageBase64);
  }
}

/**
 * 清洗OCR文本，过滤拍照App产生的噪音文字
 * 如：'3张'、'2页'、'第1张'、'共5张'等
 * 同时过滤Part2答题纸特有的噪音：CAMBRIDGE ENGLISH水印、Question标签、独立数字行等
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

  // Part2答题纸特有噪音过滤
  // 过滤 CAMBRIDGE ENGLISH 水印（不区分大小写，整行匹配）
  cleaned = cleaned.replace(/^[\s]*CAMBRIDGE ENGLISH[\s]*$/gim, '');

  // 过滤 Question 1 / Question 2 标签（不区分大小写，整行匹配）
  cleaned = cleaned.replace(/^[\s]*Question\s+[12][\s]*$/gim, '');

  // 过滤独立的数字行（纯数字，通常是页码或题号，如 "119", "99"）
  cleaned = cleaned.replace(/^[\s]*\d+[\s]*$/gm, '');

  // 过滤独立的大写短噪音 token，如 OCR 误识别出来的尾部杂字符 "IGV"
  // 只处理整行独立内容，避免误伤正文中的正常单词
  cleaned = cleaned.replace(/^[\s]*[A-Z]{2,4}[\s]*$/gm, '');

  // 过滤明显乱码行（短于3个字符且只包含ASCII字符且非英文单词的行，保留常见短单词和单字母如 I, a, b, c 等）
  // 注意：不过滤包含非ASCII字符（如中文）的行，避免误删有效内容
  const commonShortWords = new Set(['i', 'a', 'an', 'go', 'to', 'in', 'on', 'at', 'by', 'up', 'ok', 'oh', 'ah', 'no', 'so', 'if', 'we', 'he', 'me', 'my', 'us', 'do', 'be', 'is', 'am', 'it', 'as', 'of', 'or', 'ex']);
  cleaned = cleaned
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      // 如果行长度为1且是单个字母，保留（可能是选项A、B、C等）
      if (trimmed.length === 1 && /^[a-zA-Z]$/.test(trimmed)) {
        return line;
      }
      // 如果行长度小于3、只包含ASCII字符、且不是常见短单词，则过滤掉
      // 包含非ASCII字符（如中文）的行不过滤
      if (trimmed.length > 0 && trimmed.length < 3 && /^[\x00-\x7F]+$/.test(trimmed) && !commonShortWords.has(trimmed.toLowerCase())) {
        return '';
      }
      return line;
    })
    .join('\n');

  // 过滤连续超过3个的空白行，压缩为最多2个换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 去除首尾空白
  cleaned = cleaned.trim();

  return cleaned;
}
