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
