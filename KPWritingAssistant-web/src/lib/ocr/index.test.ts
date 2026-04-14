import { cleanOcrText } from './index';

describe('cleanOcrText', () => {
  // 噪音过滤测试
  describe('noise filtering', () => {
    it('should filter pure number + 张 pattern', () => {
      // '第3张' is filtered by the 第X张 pattern first, leaving just '这是'
      expect(cleanOcrText('这是第3张')).toBe('这是');
      expect(cleanOcrText('3张图片5张纸')).toBe('图片纸');
      // '第123张' is filtered by the 第X张 pattern, leaving just '这是'
      expect(cleanOcrText('这是第123张')).toBe('这是');
    });

    it('should filter pure number + 页 pattern', () => {
      // '第2页' is filtered by the 第X页 pattern first, leaving just '翻到'
      expect(cleanOcrText('翻到第2页')).toBe('翻到');
      expect(cleanOcrText('1页内容2页空白')).toBe('内容空白');
    });

    it('should filter 第X张 pattern', () => {
      expect(cleanOcrText('这是第3张图片')).toBe('这是图片');
      expect(cleanOcrText('第1张开始')).toBe('开始');
    });

    it('should filter 共X张 pattern', () => {
      expect(cleanOcrText('共5张，已完成')).toBe('，已完成');
      expect(cleanOcrText('共10张图片')).toBe('图片');
    });

    it('should filter 第X页 pattern', () => {
      expect(cleanOcrText('第1页标题')).toBe('标题');
      expect(cleanOcrText('这是第2页内容')).toBe('这是内容');
    });

    it('should filter 共X页 pattern', () => {
      expect(cleanOcrText('共10页文档')).toBe('文档');
      expect(cleanOcrText('共3页内容')).toBe('内容');
    });
  });

  // 空白处理测试
  describe('whitespace handling', () => {
    it('should compress more than 3 consecutive blank lines to 2', () => {
      expect(cleanOcrText('a\n\n\n\nb')).toBe('a\n\nb');
      expect(cleanOcrText('a\n\n\n\n\nb')).toBe('a\n\nb');
    });

    it('should preserve up to 2 blank lines', () => {
      expect(cleanOcrText('a\n\nb')).toBe('a\n\nb');
      expect(cleanOcrText('a\nb')).toBe('a\nb');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(cleanOcrText('  内容  ')).toBe('内容');
      expect(cleanOcrText('\n\n内容\n\n')).toBe('内容');
    });
  });

  // 组合与边界测试
  describe('edge cases', () => {
    it('should handle complex mixed scenarios', () => {
      expect(cleanOcrText('  第3张\n\n\n\n共5张  正文内容  2页  \n\n')).toBe('正文内容');
    });

    it('should handle text with only noise', () => {
      expect(cleanOcrText('第1张共2张3页')).toBe('');
    });

    it('should preserve normal text without noise', () => {
      expect(cleanOcrText('这是一篇作文')).toBe('这是一篇作文');
    });

    it('should handle empty string', () => {
      expect(cleanOcrText('')).toBe('');
    });

    it('should handle whitespace only string', () => {
      expect(cleanOcrText('   \n\n  ')).toBe('');
    });

    it('should not filter numbers with other units', () => {
      expect(cleanOcrText('我有3个苹果')).toBe('我有3个苹果');
      expect(cleanOcrText('3米长的绳子')).toBe('3米长的绳子');
      expect(cleanOcrText('3个小朋友')).toBe('3个小朋友');
    });

    it('should handle typical OCR output with noise', () => {
      const input = '3张\nDear friend,\n\nHow are you?\n2页';
      expect(cleanOcrText(input)).toBe('Dear friend,\n\nHow are you?');
    });

    it('should remove standalone all-caps OCR noise tokens', () => {
      expect(cleanOcrText('正文内容\nIGV')).toBe('正文内容');
      expect(cleanOcrText('IGV')).toBe('');
    });

    it('should handle multi-digit numbers', () => {
      expect(cleanOcrText('第100张图片')).toBe('图片');
      expect(cleanOcrText('共999页')).toBe('');
    });
  });
});
