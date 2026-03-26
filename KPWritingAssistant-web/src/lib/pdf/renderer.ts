/**
 * Unified copybook PDF renderer.
 * Renders a copybook PDF based on a template configuration and mode.
 *
 * Gochi Hand font: SIL Open Font License (OFL) 1.1
 * Source: https://fonts.google.com/specimen/Gochi+Hand
 * Ma Shan Zheng, ZCOOL QingKe HuangYou, Zhi Mang Xing: SIL OFL 1.1
 * Source: https://fonts.google.com/
 */
import PDFDocument from 'pdfkit';
import path from 'path';
import type { CopybookTemplate, CopybookMode } from '@/types/pdf';
import { shouldGapWord, createGap } from './gap-fill';

const FONTS_DIR = path.join(process.cwd(), 'src/assets/fonts');
const GOCHI_HAND_PATH = path.join(FONTS_DIR, 'GochiHand-Regular.ttf');
const MA_SHAN_ZHENG_PATH = path.join(FONTS_DIR, 'MaShanZheng-Regular.ttf');
const ZCOOL_PATH = path.join(FONTS_DIR, 'ZCOOLQingKeHuangYou-Regular.ttf');
const ZHI_MANG_XING_PATH = path.join(FONTS_DIR, 'ZhiMangXing-Regular.ttf');
const HENGSHUI_PATH = path.join(process.cwd(), 'font', '舒窈衡水体.ttf');
const MM_TO_PT = 2.8346;

/** Maps user-facing font_style id → PDFKit font name */
function resolveFontName(fontStyle: string): string {
  switch (fontStyle) {
    case 'courier':        return 'Courier';
    case 'times':          return 'Times-Roman';
    case 'helvetica':      return 'Helvetica';
    case 'ma-shan-zheng':  return 'MaShanZheng';
    case 'zcool':          return 'ZCOOLQingKeHuangYou';
    case 'zhi-mang-xing':  return 'ZhiMangXing';
    case 'hengshui':       return 'Hengshui';
    default:               return 'GochiHand'; // gochi-hand or unknown
  }
}

function mmToPt(mm: number): number {
  return mm * MM_TO_PT;
}

function drawCornerMarks(doc: PDFKit.PDFDocument, pageWidth: number, pageHeight: number): void {
  const markSize = 22;
  const offset = 15;
  doc.lineWidth(2).strokeColor('#000000');
  // Top-left
  doc
    .moveTo(offset, offset + markSize)
    .lineTo(offset, offset)
    .lineTo(offset + markSize, offset)
    .stroke();
  // Top-right
  doc
    .moveTo(pageWidth - offset - markSize, offset)
    .lineTo(pageWidth - offset, offset)
    .lineTo(pageWidth - offset, offset + markSize)
    .stroke();
  // Bottom-left
  doc
    .moveTo(offset, pageHeight - offset - markSize)
    .lineTo(offset, pageHeight - offset)
    .lineTo(offset + markSize, pageHeight - offset)
    .stroke();
  // Bottom-right
  doc
    .moveTo(pageWidth - offset - markSize, pageHeight - offset)
    .lineTo(pageWidth - offset, pageHeight - offset)
    .lineTo(pageWidth - offset, pageHeight - offset - markSize)
    .stroke();
}

function drawCambridgeWatermark(
  doc: PDFKit.PDFDocument,
  pageWidth: number,
  pageHeight: number
): void {
  const text =
    'CAMBRIDGE ENGLISH  CAMBRIDGE ENGLISH  CAMBRIDGE ENGLISH  CAMBRIDGE ENGLISH  CAMBRIDGE ENGLISH  CAMBRIDGE ENGLISH  CAMBRIDGE ENGLISH';
  doc.save();
  // Position the vertical text on the right edge
  doc
    .translate(pageWidth - 14, pageHeight - 15)
    .rotate(-90)
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#555555')
    .text(text, 0, 0, { lineBreak: false });
  doc.restore();
}

function drawTopInstructions(
  doc: PDFKit.PDFDocument,
  instructions: string[],
  startY: number,
  pageWidth: number,
  firstLineRightAlign?: boolean
): number {
  const leftPad = mmToPt(20);
  const fontSize = 10;
  doc.fontSize(fontSize).font('Helvetica').fillColor('#000000');
  let y = startY;
  for (let i = 0; i < instructions.length; i++) {
    const align = firstLineRightAlign && i === 0 ? 'right' : 'left';
    doc.text(instructions[i], leftPad, y, { width: pageWidth - leftPad * 2, lineBreak: false, align });
    y += fontSize + 8;
  }
  return y;
}


function drawPart2SelectorHeader(
  doc: PDFKit.PDFDocument,
  startY: number,
  answerAreaX: number,
  answerAreaWidth: number,
  headerHeight: number,
  headerBgColor: string,
  headerFontSize: number,
  borderColor: string
): void {
  // Light header background
  doc.fillColor(headerBgColor).rect(answerAreaX, startY, answerAreaWidth, headerHeight).fill();

  // Header bottom border
  doc
    .lineWidth(1)
    .strokeColor(borderColor)
    .moveTo(answerAreaX, startY + headerHeight)
    .lineTo(answerAreaX + answerAreaWidth, startY + headerHeight)
    .stroke();

  // "Part 2" label
  const textY = startY + (headerHeight - headerFontSize) / 2;
  doc
    .fontSize(headerFontSize)
    .font('Helvetica-Bold')
    .fillColor('#000000')
    .text('Part 2', answerAreaX + 10, textY, { lineBreak: false });

  // "Question 2 □" and "Question 3 □" checkboxes
  const checkboxSize = 14;
  const q2X = answerAreaX + 80;
  const q3X = answerAreaX + 190;
  const cbY = startY + (headerHeight - checkboxSize) / 2;

  doc
    .fontSize(headerFontSize)
    .font('Helvetica')
    .fillColor('#000000')
    .text('Question 2', q2X, textY, { lineBreak: false });
  doc
    .lineWidth(1)
    .strokeColor('#000000')
    .rect(q2X + 72, cbY, checkboxSize, checkboxSize)
    .stroke();

  doc
    .fontSize(headerFontSize)
    .font('Helvetica')
    .fillColor('#000000')
    .text('Question 3', q3X, textY, { lineBreak: false });
  doc
    .lineWidth(1)
    .strokeColor('#000000')
    .rect(q3X + 72, cbY, checkboxSize, checkboxSize)
    .stroke();
}

function drawAnswerContainer(
  doc: PDFKit.PDFDocument,
  template: CopybookTemplate,
  pageLines: string[],
  mode: CopybookMode,
  fontStyle: string,
  tracingColor: string,
  startY: number,
  answerAreaX: number,
  answerAreaWidth: number,
  customFontSize?: number,
  gapFillWords?: string[]
): number {
  const {
    linesPerPage, lineHeight, headerText, headerBgColor, headerFontSize, defaultFontSize,
    headerType, borderColor: templateBorderColor,
  } = template;

  const borderColor = templateBorderColor ?? '#000000';

  // Use custom font size if provided, otherwise use template default
  const contentFontSize = customFontSize ?? defaultFontSize;

  const headerHeight = 28;
  const containerHeight = headerHeight + linesPerPage * lineHeight;

  // Outer container border
  doc.lineWidth(1).strokeColor(borderColor).rect(answerAreaX, startY, answerAreaWidth, containerHeight).stroke();

  if (headerType === 'part2-selector') {
    drawPart2SelectorHeader(
      doc, startY, answerAreaX, answerAreaWidth, headerHeight,
      headerBgColor, headerFontSize, borderColor
    );
  } else {
    // Default: "Question 1" style grey header
    doc.fillColor(headerBgColor).rect(answerAreaX, startY, answerAreaWidth, headerHeight).fill();

    doc
      .lineWidth(1)
      .strokeColor('#000000')
      .moveTo(answerAreaX, startY + headerHeight)
      .lineTo(answerAreaX + answerAreaWidth, startY + headerHeight)
      .stroke();

    doc
      .fontSize(headerFontSize)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(headerText, answerAreaX, startY + (headerHeight - headerFontSize) / 2, {
        width: answerAreaWidth,
        align: 'center',
        lineBreak: false,
      });
  }

  // Answer lines
  const linesStartY = startY + headerHeight;
  for (let i = 0; i < linesPerPage; i++) {
    const lineY = linesStartY + i * lineHeight;

    // Line bottom border (skip last line — container border covers it)
    if (i < linesPerPage - 1) {
      doc
        .lineWidth(0.5)
        .strokeColor(borderColor)
        .moveTo(answerAreaX, lineY + lineHeight)
        .lineTo(answerAreaX + answerAreaWidth, lineY + lineHeight)
        .stroke();
    }

    // Tracing mode: render essay text on each line (with gray color for tracing)
    if (mode === 'tracing' && pageLines[i]) {
      // Position text near the bottom of the line so it sits on the baseline
      const textY = lineY + lineHeight - contentFontSize - 2;
      const textX = answerAreaX + 6;
      const availableWidth = answerAreaWidth - 12;

      // Check if this is the last line with content
      const isLastLine = !pageLines.slice(i + 1).some(line => line && line.trim() !== '');

      // Split line into words and calculate word spacing adjustment
      const words = pageLines[i].split(' ').filter(Boolean);
      let wordSpacing: number | undefined;

      // Only justify if not the last line and has multiple words
      if (!isLastLine && words.length > 1) {
        doc.fontSize(contentFontSize).font(resolveFontName(fontStyle));
        const extraSpacing = justifyLine(doc, words, availableWidth, 12);
        if (extraSpacing !== null && extraSpacing > 0) {
          wordSpacing = extraSpacing;
        }
      }

      doc
        .fontSize(contentFontSize)
        .font(resolveFontName(fontStyle))
        .fillColor(tracingColor)
        .text(pageLines[i], textX, textY, {
          width: availableWidth,
          lineBreak: false,
          ...(wordSpacing !== undefined ? { wordSpacing } : {}),
        });
    }

    // Dictation mode: render essay text with gaps for specific words
    if (mode === 'dictation' && pageLines[i] && gapFillWords && gapFillWords.length > 0) {
      // Position text near the bottom of the line so it sits on the baseline
      const textY = lineY + lineHeight - contentFontSize - 2;
      const textX = answerAreaX + 6;
      const availableWidth = answerAreaWidth - 12;

      // Process each word: replace gapped words with underscores
      const words = pageLines[i].split(' ').filter(Boolean);
      const processedWords = words.map(word => {
        if (shouldGapWord(word, gapFillWords)) {
          return createGap(word);
        }
        return word;
      });

      const processedLine = processedWords.join(' ');

      // Check if this is the last line with content
      const isLastLine = !pageLines.slice(i + 1).some(line => line && line.trim() !== '');

      // Calculate word spacing adjustment
      let wordSpacing: number | undefined;
      if (!isLastLine && processedWords.length > 1) {
        doc.fontSize(contentFontSize).font(resolveFontName(fontStyle));
        const extraSpacing = justifyLine(doc, processedWords, availableWidth, 12);
        if (extraSpacing !== null && extraSpacing > 0) {
          wordSpacing = extraSpacing;
        }
      }

      doc
        .fontSize(contentFontSize)
        .font(resolveFontName(fontStyle))
        .fillColor('#1a1a1a')
        .text(processedLine, textX, textY, {
          width: availableWidth,
          lineBreak: false,
          ...(wordSpacing !== undefined ? { wordSpacing } : {}),
        });
    }
  }

  return startY + containerHeight;
}

function drawExaminerSection(
  doc: PDFKit.PDFDocument,
  columns: string[],
  startY: number,
  leftMargin: number
): void {
  const titleFontSize = 10;
  const cellWidth = 52;
  const headerCellHeight = 22;
  const bodyCellHeight = 26;

  doc
    .fontSize(titleFontSize)
    .font('Helvetica')
    .fillColor('#000000')
    .text('This section for use by Examiner only:', leftMargin, startY, { lineBreak: false });

  const tableY = startY + titleFontSize + 10;

  for (let i = 0; i < columns.length; i++) {
    const cellX = leftMargin + i * cellWidth;
    // Header cell
    doc.fillColor('#b8b8b8').rect(cellX, tableY, cellWidth, headerCellHeight).fill();
    doc.lineWidth(1).strokeColor('#000000').rect(cellX, tableY, cellWidth, headerCellHeight).stroke();
    doc
      .fontSize(titleFontSize)
      .font('Helvetica')
      .fillColor('#000000')
      .text(columns[i], cellX, tableY + (headerCellHeight - titleFontSize) / 2, {
        width: cellWidth,
        align: 'center',
        lineBreak: false,
      });
    // Body cell (empty)
    doc
      .lineWidth(1)
      .strokeColor('#000000')
      .rect(cellX, tableY + headerCellHeight, cellWidth, bodyCellHeight)
      .stroke();
  }
}

function drawBarcode(doc: PDFKit.PDFDocument, pageWidth: number, pageHeight: number): void {
  const areaY = pageHeight - 42;
  const centerX = pageWidth / 2;

  // QR placeholder
  doc.fillColor('#000000').rect(centerX - 85, areaY + 2, 18, 18).fill();

  // Barcode bars
  let barX = centerX - 55;
  for (let i = 0; i < 40; i++) {
    const barWidth = i % 2 === 0 ? 2 : 1;
    doc.fillColor('#000000').rect(barX, areaY, barWidth, 26).fill();
    barX += barWidth + 1;
  }

  // Barcode number
  doc
    .fontSize(7)
    .font('Helvetica')
    .fillColor('#555555')
    .text('00104468811102', centerX - 28, areaY + 28, { lineBreak: false });
}

/**
 * Wraps a single paragraph of words into lines fitting within maxWidth,
 * targeting ~targetWordsPerLine words per line with elastic range (target-2 to target+2).
 *
 * Algorithm:
 * 1. Target words per line: targetWordsPerLine (default 10)
 * 2. Elastic range: [target-2, target+2] = [8, 12] for target 10
 * 3. Line breaks occur when:
 *    - Adding next word would exceed maxWidth * 0.95 (95% of line width)
 *    - Current line has reached maxWordsPerLine (12 for target 10)
 *    - It's the last word
 */
export function wrapParagraph(
  doc: PDFKit.PDFDocument,
  paragraph: string,
  maxWidth: number,
  targetWordsPerLine: number
): string[] {
  const minWordsPerLine = Math.max(1, targetWordsPerLine - 2); // Minimum 8 for target 10
  const maxWordsPerLine = targetWordsPerLine + 2; // Maximum 12 for target 10
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let currentLine: string[] = [];

  for (let i = 0; i < words.length; i++) {
    currentLine.push(words[i]);
    const testLine = currentLine.join(' ');
    const nextWord = words[i + 1];
    const wouldExceedWidth = nextWord && doc.widthOfString(testLine + ' ' + nextWord) > maxWidth * 0.95; // 95% of max width
    const reachedMaxCount = currentLine.length >= maxWordsPerLine;
    const isLastWord = i === words.length - 1;

    if (wouldExceedWidth || reachedMaxCount || isLastWord) {
      lines.push(testLine);
      currentLine = [];
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  return lines;
}

/**
 * Wraps essay text into lines for tracing, preserving the original line/paragraph
 * structure (e.g. email salutation, body paragraphs, sign-off).
 * Each non-empty source line is wrapped independently; blank lines are filtered out.
 */
export function wrapTextWithFontMetrics(
  doc: PDFKit.PDFDocument,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontName: string,
  targetWordsPerLine: number = 10
): string[] {
  doc.fontSize(fontSize).font(fontName);
  // Split on single newlines to preserve email structure (salutation, paragraphs, sign-off)
  const sourceLines = text.split('\n');
  const lines: string[] = [];

  for (const sourceLine of sourceLines) {
    const trimmed = sourceLine.trim();
    if (trimmed === '') {
      // Skip blank lines - no empty slots inserted
      continue;
    } else {
      const wrapped = wrapParagraph(doc, trimmed, maxWidth, targetWordsPerLine);
      lines.push(...wrapped);
    }
  }

  return lines;
}

/** Convert opacity (0-100) to a hex gray color suitable for tracing text */
function opacityToTracingColor(opacity: number): string {
  const clamped = Math.max(0, Math.min(100, opacity));
  // opacity=100 → black (#000000); opacity=30 → light gray (#b3b3b3)
  const gray = Math.round(255 * (1 - clamped / 100));
  const hex = gray.toString(16).padStart(2, '0');
  return `#${hex}${hex}${hex}`;
}

/**
 * Calculates extra spacing to distribute between words for justified alignment.
 * Returns null if the remaining space is too large to justify (exceeds threshold).
 *
 * @param doc - PDFKit document
 * @param words - Array of words in the line
 * @param lineWidth - Available width for the line
 * @param maxExtraSpacePerWord - Maximum extra space per word (default 12pt)
 * @returns Extra spacing to add between words, or null to use left alignment
 */
export function justifyLine(
  doc: PDFKit.PDFDocument,
  words: string[],
  lineWidth: number,
  maxExtraSpacePerWord: number = 12
): number | null {
  // Single word or empty line cannot be justified
  if (words.length <= 1) {
    return null;
  }

  // Calculate total width of words
  const totalWordWidth = words.reduce((sum, word) => {
    return sum + doc.widthOfString(word);
  }, 0);

  // Calculate remaining space
  const spaceCount = words.length - 1;
  const remainingSpace = lineWidth - totalWordWidth;

  // Check if remaining space is within reasonable range
  const maxJustifiableSpace = words.length * maxExtraSpacePerWord;
  if (remainingSpace > maxJustifiableSpace) {
    return null; // Too much space, use left alignment
  }

  // Calculate extra spacing per gap
  const extraSpacing = remainingSpace / spaceCount;
  return extraSpacing;
}

export async function renderCopybookPDF(
  essayText: string,
  template: CopybookTemplate,
  mode: CopybookMode,
  fontStyle: string = 'gochi-hand',
  tracingOpacity: number = 30,
  customFontSize?: number,
  gapFillWords?: string[]
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
    // Register custom fonts
    doc.registerFont('GochiHand', GOCHI_HAND_PATH);
    doc.registerFont('MaShanZheng', MA_SHAN_ZHENG_PATH);
    doc.registerFont('ZCOOLQingKeHuangYou', ZCOOL_PATH);
    doc.registerFont('ZhiMangXing', ZHI_MANG_XING_PATH);
    doc.registerFont('Hengshui', HENGSHUI_PATH);

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { pageWidth, pageHeight, linesPerPage, defaultFontSize } = template;
    // Use custom font size if provided, otherwise use template default
    const contentFontSize = customFontSize ?? defaultFontSize;
    const answerAreaWidth = mmToPt(template.answerAreaWidthMm);
    const answerAreaX = (pageWidth - answerAreaWidth) / 2;

    // Resolve font name, falling back to GochiHand if the selected font is incompatible.
    // We use a longer string to trigger GPOS/layout processing that may expose corrupt glyphs.
    let fontName = resolveFontName(fontStyle);
    try {
      doc.fontSize(12).font(fontName);
      doc.widthOfString('The quick brown fox jumps over the lazy dog. Hello world testing.');
    } catch {
      console.warn(`[renderer] Font "${fontName}" failed compatibility check, falling back to GochiHand`);
      fontName = 'GochiHand';
    }
    const tracingColor = mode === 'tracing' ? opacityToTracingColor(tracingOpacity) : '#1a1a1a';
    const usableWidth = answerAreaWidth - 12; // minus left/right padding
    // Wrap text for both tracing and dictation modes
    const allLines = (mode === 'tracing' || mode === 'dictation')
      ? wrapTextWithFontMetrics(doc, essayText, usableWidth, contentFontSize, fontName, 10)
      : [];

    const pageCount = (mode === 'tracing' || mode === 'dictation')
      ? Math.max(1, Math.ceil(allLines.length / linesPerPage))
      : 1;

    for (let page = 0; page < pageCount; page++) {
      if (page > 0) doc.addPage({ size: 'A4', margin: 0 });

      const pageLines = allLines.slice(page * linesPerPage, (page + 1) * linesPerPage);

      if (template.showCornerMarks) drawCornerMarks(doc, pageWidth, pageHeight);
      if (template.showCambridgeWatermark) drawCambridgeWatermark(doc, pageWidth, pageHeight);

      const instructionsEndY = drawTopInstructions(
        doc,
        template.topInstructions,
        50,
        pageWidth,
        template.headerType === 'part2-selector'
      );

      const containerStartY = instructionsEndY + 14;
      const containerEndY = drawAnswerContainer(
        doc,
        template,
        pageLines,
        mode,
        fontStyle,
        tracingColor,
        containerStartY,
        answerAreaX,
        answerAreaWidth,
        customFontSize,
        gapFillWords
      );

      if (template.showExaminerTable) {
        drawExaminerSection(doc, template.examinerColumns, containerEndY + 14, answerAreaX);
      }

      if (template.showBarcode) {
        drawBarcode(doc, pageWidth, pageHeight);
      }
    }

    doc.end();
  });
}
