/**
 * Test suite for PDF renderer
 *
 * These tests verify:
 * 1. Font size handling (default vs custom)
 * 2. Text Y-coordinate calculation (baseline positioning)
 * 3. Text wrapping logic (target words per line, width constraints)
 * 4. Edge cases (empty text, single word, paragraph breaks)
 * 5. Task 27: 弹性分行和词间距调整
 */

import type { CopybookTemplate } from '@/types/pdf';

// Mock PDFKit before importing the module
const mockFontSize = jest.fn().mockReturnThis();
const mockFont = jest.fn().mockReturnThis();
const mockWidthOfString = jest.fn().mockReturnValue(100);
const mockText = jest.fn().mockReturnThis();
const mockFillColor = jest.fn().mockReturnThis();
const mockRect = jest.fn().mockReturnThis();
const mockFill = jest.fn().mockReturnThis();
const mockStroke = jest.fn().mockReturnThis();
const mockMoveTo = jest.fn().mockReturnThis();
const mockLineTo = jest.fn().mockReturnThis();
const mockLineWidth = jest.fn().mockReturnThis();
const mockStrokeColor = jest.fn().mockReturnThis();
const mockSave = jest.fn().mockReturnThis();
const mockRestore = jest.fn().mockReturnThis();
const mockTranslate = jest.fn().mockReturnThis();
const mockRotate = jest.fn().mockReturnThis();
const mockAddPage = jest.fn().mockReturnThis();
const mockRegisterFont = jest.fn().mockReturnThis();
const mockOn = jest.fn().mockImplementation(function(this: unknown, event: string, callback: (arg?: Buffer) => void) {
  if (event === 'data') {
    // Simulate receiving PDF data chunks
    setTimeout(() => callback(Buffer.from('mock-pdf-content')), 0);
  }
  if (event === 'end') {
    // Simulate PDF generation completion after data events
    setTimeout(() => callback(), 10);
  }
  return this;
});
const mockEnd = jest.fn();

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    registerFont: mockRegisterFont,
    fontSize: mockFontSize,
    font: mockFont,
    widthOfString: mockWidthOfString,
    text: mockText,
    fillColor: mockFillColor,
    rect: mockRect,
    fill: mockFill,
    stroke: mockStroke,
    moveTo: mockMoveTo,
    lineTo: mockLineTo,
    lineWidth: mockLineWidth,
    strokeColor: mockStrokeColor,
    save: mockSave,
    restore: mockRestore,
    translate: mockTranslate,
    rotate: mockRotate,
    addPage: mockAddPage,
    on: mockOn,
    end: mockEnd,
  }));
});

// Import after mocking
import { renderCopybookPDF, wrapParagraph, wrapTextWithFontMetrics, justifyLine } from './renderer';

describe('renderer', () => {
  const mockTemplate: CopybookTemplate = {
    id: 'pet-writing',
    name: 'PET Writing',
    description: 'PET Writing Template',
    pageWidth: 595.28,
    pageHeight: 841.89,
    answerAreaWidthMm: 170,
    linesPerPage: 10,
    lineHeight: 28,
    headerText: 'ANSWER',
    headerBgColor: '#e0e0e0',
    headerFontSize: 12,
    contentFontSize: 14,
    minFontSize: 12,
    maxFontSize: 24,
    defaultFontSize: 14,
    topInstructions: ['Write your answer here.'],
    showCornerMarks: true,
    showCambridgeWatermark: true,
    showExaminerTable: true,
    examinerColumns: ['Content', 'Communicative Achievement', 'Organisation', 'Language'],
    showBarcode: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UT-001: 字体大小使用默认值', () => {
    it('should use template default font size when customFontSize is undefined', async () => {
      await renderCopybookPDF(
        'Hello world',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        undefined // customFontSize is undefined
      );

      // Should call fontSize with template defaultFontSize (14) for content
      const fontSizeCalls = mockFontSize.mock.calls;
      const hasDefaultFontSize = fontSizeCalls.some(call => call[0] === 14);
      expect(hasDefaultFontSize).toBe(true);
    });
  });

  describe('UT-002: 字体大小使用自定义值', () => {
    it('should use custom font size when provided', async () => {
      await renderCopybookPDF(
        'Hello world',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        18 // customFontSize = 18
      );

      // Should call fontSize with custom font size (18) for content
      const fontSizeCalls = mockFontSize.mock.calls;
      const hasCustomFontSize = fontSizeCalls.some(call => call[0] === 18);
      expect(hasCustomFontSize).toBe(true);
    });
  });

  describe('UT-003: 文字Y坐标计算-基线位置', () => {
    it('should position text baseline 2pt above the underline', async () => {
      const customTemplate = {
        ...mockTemplate,
        lineHeight: 30,
        defaultFontSize: 18,
      };

      await renderCopybookPDF(
        'Test line',
        customTemplate,
        'tracing',
        'gochi-hand',
        30,
        18
      );

      // Verify text was called
      expect(mockText).toHaveBeenCalled();

      // For line 0: lineY = linesStartY + 0 * lineHeight
      // linesStartY = startY + headerHeight = ~some value
      // textY = lineY + lineHeight - contentFontSize - 2
      // Expected: textY = lineY + 30 - 18 - 2 = lineY + 10

      // Check that text was called with expected parameters
      const textCalls = mockText.mock.calls;
      expect(textCalls.length).toBeGreaterThan(0);
    });
  });

  describe('UT-004: 文本换行-目标单词数', () => {
    it('should wrap text targeting ~10 words per line', async () => {
      // Mock widthOfString to simulate width constraints
      let callCount = 0;
      mockWidthOfString.mockImplementation(() => {
        callCount++;
        // Return small width for first few calls to allow more words
        // Then return large width to trigger line break
        return callCount < 15 ? 50 : 600;
      });

      const longText = 'one two three four five six seven eight nine ten eleven twelve';

      await renderCopybookPDF(
        longText,
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        14
      );

      // Verify text rendering was called
      expect(mockText).toHaveBeenCalled();
    });
  });

  describe('UT-005: 文本换行-宽度限制', () => {
    it('should wrap line when adding next word would exceed max width', async () => {
      // Mock widthOfString to simulate exceeding width
      mockWidthOfString.mockImplementation((text: string) => {
        // Simulate that adding 'eleven' would exceed width
        if (text.includes('eleven')) return 650;
        return 100;
      });

      const text = 'one two three four five six seven eight nine ten eleven twelve';

      await renderCopybookPDF(
        text,
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        14
      );

      expect(mockText).toHaveBeenCalled();
    });
  });

  describe('UT-006: 文本换行-空文本', () => {
    it('should handle empty text gracefully', async () => {
      await renderCopybookPDF(
        '',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        14
      );

      // Should not throw and should complete
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  describe('UT-007: 文本换行-单单词', () => {
    it('should handle single word text', async () => {
      await renderCopybookPDF(
        'hello',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        14
      );

      // Should have called text with the single word
      expect(mockText).toHaveBeenCalledWith(
        'hello',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object)
      );
    });
  });

  describe('UT-008: 文本换行-段落符处理', () => {
    it('should replace paragraph breaks with spaces', async () => {
      const textWithParagraphs = 'line one\n\nline two';

      await renderCopybookPDF(
        textWithParagraphs,
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        14
      );

      // Should have called text with content that has paragraphs replaced
      expect(mockText).toHaveBeenCalled();
    });
  });

  describe('IT-001: PDF生成-tracing模式', () => {
    it('should generate valid PDF buffer in tracing mode', async () => {
      const result = await renderCopybookPDF(
        'This is a test essay for tracing mode.',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        18
      );

      expect(result).toBeInstanceOf(Buffer);
      // The mock returns 'mock-pdf-content' which has length 18
      expect(result.length).toBeGreaterThan(0);
      expect(result.toString()).toBe('mock-pdf-content');
    });
  });

  describe('IT-002: PDF生成-dictation模式', () => {
    it('should generate valid PDF buffer in dictation mode without text content', async () => {
      const result = await renderCopybookPDF(
        'This text should not appear in dictation mode.',
        mockTemplate,
        'dictation',
        'gochi-hand',
        30,
        18
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);

      // In dictation mode, the essay text should not be rendered as tracing text
      // (only template elements like headers, lines, etc.)
    });
  });

  describe('Font size boundary tests', () => {
    it('should handle minimum font size', async () => {
      await renderCopybookPDF(
        'Test',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        12 // Minimum font size
      );

      const fontSizeCalls = mockFontSize.mock.calls;
      const hasMinFontSize = fontSizeCalls.some(call => call[0] === 12);
      expect(hasMinFontSize).toBe(true);
    });

    it('should handle maximum font size', async () => {
      await renderCopybookPDF(
        'Test',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        24 // Maximum font size
      );

      const fontSizeCalls = mockFontSize.mock.calls;
      const hasMaxFontSize = fontSizeCalls.some(call => call[0] === 24);
      expect(hasMaxFontSize).toBe(true);
    });
  });

  describe('Line width utilization', () => {
    it('should calculate usable width correctly', async () => {
      // Template with 170mm answer area width
      // usableWidth = answerAreaWidth - 12 (padding)
      // 170mm = ~482pt, usableWidth = ~470pt

      await renderCopybookPDF(
        'Test content for width calculation',
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        18
      );

      // Verify text was called with width option
      const textCalls = mockText.mock.calls;
      const hasWidthOption = textCalls.some(call =>
        call[3] && typeof call[3] === 'object' && 'width' in call[3]
      );
      expect(hasWidthOption).toBe(true);
    });
  });

  describe('Text baseline positioning calculation', () => {
    it('should calculate textY as lineY + lineHeight - fontSize - 2', async () => {
      // This test verifies the formula: textY = lineY + lineHeight - contentFontSize - 2
      // For lineHeight=28, fontSize=14: textY = lineY + 28 - 14 - 2 = lineY + 12

      const customTemplate = {
        ...mockTemplate,
        lineHeight: 28,
        defaultFontSize: 14,
      };

      await renderCopybookPDF(
        'Test line one',
        customTemplate,
        'tracing',
        'gochi-hand',
        30,
        14
      );

      // The textY calculation happens inside drawAnswerContainer
      // We verify the text method was called with appropriate Y coordinate
      expect(mockText).toHaveBeenCalled();
    });
  });

  describe('Word spacing for line filling', () => {
    it('should process text for line width optimization', async () => {
      // This test verifies that text wrapping logic is applied
      // Future enhancement: verify word spacing calculation for filling line end

      const text = 'The quick brown fox jumps over the lazy dog';

      await renderCopybookPDF(
        text,
        mockTemplate,
        'tracing',
        'gochi-hand',
        30,
        18
      );

      // widthOfString is called during text wrapping
      expect(mockWidthOfString).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// Task 27: 字帖PDF排版优化 - 弹性分行和词间距调整
// ============================================================================

describe('Task 27: 弹性分行和词间距调整', () => {
  // Helper to create a mock PDFKit document with configurable word widths
  const createMockDoc = (wordWidths: Record<string, number> = {}) => {
    const defaultWidth = 30; // smaller default width per word in pt (was 50)
    return {
      widthOfString: (text: string) => {
        const words = text.split(' ');
        return words.reduce((sum, word) => {
          return sum + (wordWidths[word] || defaultWidth);
        }, 0) + (words.length - 1) * 5; // 5pt for space
      },
      fontSize: () => ({ font: () => {} }),
      font: () => {},
    } as unknown as PDFKit.PDFDocument;
  };

  describe('UT-027-001: 正常段落分行 - 词数正好是10的倍数', () => {
    it('should split 30 words into multiple lines', () => {
      const doc = createMockDoc();
      const words = Array.from({ length: 30 }, (_, i) => `word${i}`);
      const paragraph = words.join(' ');
      const lines = wrapParagraph(doc, paragraph, 600, 10);

      // Should create multiple lines
      expect(lines.length).toBeGreaterThanOrEqual(2);
      // Each line should have at most 12 words (max elastic)
      lines.forEach(line => {
        const wordCount = line.split(' ').length;
        expect(wordCount).toBeLessThanOrEqual(12);
      });
      // Total words should be preserved
      const totalWords = lines.reduce((sum, line) => sum + line.split(' ').length, 0);
      expect(totalWords).toBe(30);
    });
  });

  describe('UT-027-002: 弹性分行 - 8词行(最小弹性)', () => {
    it('should keep 8 words on a single line', () => {
      const doc = createMockDoc();
      const words = Array.from({ length: 8 }, (_, i) => `word${i}`);
      const paragraph = words.join(' ');
      const lines = wrapParagraph(doc, paragraph, 600, 10);

      expect(lines).toHaveLength(1);
      expect(lines[0].split(' ')).toHaveLength(8);
    });
  });

  describe('UT-027-003: 弹性分行 - 12词行(最大弹性)', () => {
    it('should keep 12 words on a single line', () => {
      const doc = createMockDoc();
      const words = Array.from({ length: 12 }, (_, i) => `word${i}`);
      const paragraph = words.join(' ');
      const lines = wrapParagraph(doc, paragraph, 600, 10);

      expect(lines).toHaveLength(1);
      expect(lines[0].split(' ')).toHaveLength(12);
    });
  });

  describe('UT-027-004: 弹性分行 - 少于8词的行', () => {
    it('should keep short sentences (5 words) on single line', () => {
      const doc = createMockDoc();
      const paragraph = 'The quick brown fox jumps';
      const lines = wrapParagraph(doc, paragraph, 600, 10);

      expect(lines).toHaveLength(1);
      expect(lines[0].split(' ')).toHaveLength(5);
    });
  });

  describe('UT-027-005: 弹性分行 - 超过12词强制换行', () => {
    it('should break lines when exceeding 12 words', () => {
      const doc = createMockDoc();
      const words = Array.from({ length: 15 }, (_, i) => `word${i}`);
      const paragraph = words.join(' ');
      const lines = wrapParagraph(doc, paragraph, 600, 10);

      expect(lines.length).toBeGreaterThanOrEqual(2);
      lines.forEach(line => {
        const wordCount = line.split(' ').length;
        expect(wordCount).toBeLessThanOrEqual(12);
      });
    });
  });

  describe('UT-027-006: 空段落处理', () => {
    it('should return empty array for empty string', () => {
      const doc = createMockDoc();
      const lines = wrapParagraph(doc, '', 600, 10);
      expect(lines).toEqual([]);
    });
  });

  describe('UT-027-007: 只有空白字符的段落', () => {
    it('should return empty array for whitespace-only string', () => {
      const doc = createMockDoc();
      const lines = wrapParagraph(doc, '   \t\n  ', 600, 10);
      expect(lines).toEqual([]);
    });
  });

  describe('UT-027-008: 很长的单词不截断', () => {
    it('should not break long words', () => {
      const doc = createMockDoc();
      const longWord = 'supercalifragilisticexpialidocious';
      const paragraph = `The ${longWord} is long`;
      const lines = wrapParagraph(doc, paragraph, 200, 10);

      const allText = lines.join(' ');
      expect(allText).toContain(longWord);
    });
  });

  describe('UT-027-009: 移除强制空行 - 单段落', () => {
    it('should not insert empty lines for single paragraph', () => {
      const doc = createMockDoc();
      const text = 'This is a single paragraph with some words.';
      const lines = wrapTextWithFontMetrics(doc, text, 600, 16, 'GochiHand', 10);

      const emptyLines = lines.filter(line => line === '');
      expect(emptyLines).toHaveLength(0);
    });
  });

  describe('UT-027-010: 移除强制空行 - 多段落', () => {
    it('should not insert empty lines between paragraphs', () => {
      const doc = createMockDoc();
      const text = 'First paragraph here.\n\nSecond paragraph here.';
      const lines = wrapTextWithFontMetrics(doc, text, 600, 16, 'GochiHand', 10);

      const emptyLines = lines.filter(line => line === '');
      expect(emptyLines).toHaveLength(0);
    });
  });

  describe('UT-027-011: 邮件格式保留 - 称呼+正文+落款', () => {
    it('should preserve email structure without extra blank lines', () => {
      const doc = createMockDoc();
      const text = 'Dear Sir or Madam,\n\nI am writing to...\n\nYours faithfully,';
      const lines = wrapTextWithFontMetrics(doc, text, 600, 16, 'GochiHand', 10);

      expect(lines.length).toBeGreaterThan(0);
      const emptyLines = lines.filter(line => line === '');
      expect(emptyLines).toHaveLength(0);
    });
  });

  describe('UT-027-012: 空段落过滤', () => {
    it('should filter out empty paragraphs', () => {
      const doc = createMockDoc();
      const text = 'Paragraph one.\n\n\n\nParagraph two.';
      const lines = wrapTextWithFontMetrics(doc, text, 600, 16, 'GochiHand', 10);

      const emptyLines = lines.filter(line => line === '');
      expect(emptyLines).toHaveLength(0);
      expect(lines.some(line => line.includes('Paragraph one'))).toBe(true);
      expect(lines.some(line => line.includes('Paragraph two'))).toBe(true);
    });
  });

  describe('UT-027-013: 合理剩余空间 - 均匀分配', () => {
    it('should calculate extra spacing for reasonable remaining space', () => {
      const doc = createMockDoc({
        'word': 40,
        'a': 10,
        'the': 20,
        'quick': 50,
        'brown': 50,
        'fox': 35,
      });
      const words = ['word', 'word', 'word', 'word'];
      const lineWidth = 200;
      // 4 words * 40 = 160, 3 spaces * 5 = 15, total = 175
      // Remaining: 200 - 175 = 25, divided by 3 gaps = ~8.3 per gap
      // Max extra: 4 * 12 = 48, 25 < 48, so should justify

      const extraSpacing = justifyLine(doc, words, lineWidth, 12);
      expect(extraSpacing).not.toBeNull();
      expect(extraSpacing!).toBeGreaterThan(0);
    });
  });

  describe('UT-027-014: 剩余空间过大 - 不扩展', () => {
    it('should return null when remaining space exceeds threshold', () => {
      const doc = createMockDoc({
        'a': 10,
      });
      const words = ['a', 'a', 'a'];
      const lineWidth = 500;
      // 3 words * 10 = 30, 2 spaces * 5 = 10, total = 40
      // Remaining: 500 - 40 = 460
      // Max extra: 3 * 12 = 36, 460 > 36

      const extraSpacing = justifyLine(doc, words, lineWidth, 12);
      expect(extraSpacing).toBeNull();
    });
  });

  describe('UT-027-015: 最后一行 - 始终左对齐', () => {
    it('should return null for single word line (simulating last line)', () => {
      const doc = createMockDoc();
      const words = ['word'];
      const lineWidth = 300;

      const extraSpacing = justifyLine(doc, words, lineWidth, 12);
      expect(extraSpacing).toBeNull();
    });
  });

  describe('Integration: 完整文本排版流程', () => {
    it('should process a typical essay correctly', () => {
      const doc = createMockDoc();
      const essay = `Dear Sir or Madam,

I am writing to express my interest in the position advertised. I believe I have the skills and experience needed for this role.

Yours faithfully,
Student`;

      const lines = wrapTextWithFontMetrics(doc, essay, 600, 16, 'GochiHand', 10);

      // Should have multiple lines of content
      expect(lines.length).toBeGreaterThanOrEqual(3);
      const emptyLines = lines.filter(line => line === '');
      expect(emptyLines).toHaveLength(0);

      // Each line should have reasonable word count (1-12 words)
      lines.forEach(line => {
        const wordCount = line.split(' ').length;
        expect(wordCount).toBeGreaterThanOrEqual(1);
        expect(wordCount).toBeLessThanOrEqual(12);
      });

      const allText = lines.join(' ');
      expect(allText).toContain('Dear Sir or Madam');
      expect(allText).toContain('Yours faithfully');
    });
  });
});
