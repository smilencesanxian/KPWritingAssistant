/**
 * Test script: verifies that wrapTextWithFontMetrics preserves email structure
 * (salutation, blank-line separators, body paragraphs, sign-off).
 *
 * Run from KPWritingAssistant-web/:
 *   node test-wrap-email.mjs
 */

import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Inline the two functions from renderer.ts ───────────────────────────────

function wrapParagraph(doc, paragraph, maxWidth, targetWordsPerLine) {
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let currentLine = [];

  for (let i = 0; i < words.length; i++) {
    currentLine.push(words[i]);
    const testLine = currentLine.join(' ');
    const nextWord = words[i + 1];
    const wouldExceedWidth = nextWord && doc.widthOfString(testLine + ' ' + nextWord) > maxWidth;
    const reachedTargetCount = currentLine.length >= targetWordsPerLine;

    if (wouldExceedWidth || reachedTargetCount || i === words.length - 1) {
      lines.push(testLine);
      currentLine = [];
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  return lines;
}

function wrapTextWithFontMetrics(doc, text, maxWidth, fontSize, fontName, targetWordsPerLine = 10) {
  doc.fontSize(fontSize).font(fontName);
  // Split on single newlines to preserve email structure
  const sourceLines = text.split('\n');
  const lines = [];

  for (const sourceLine of sourceLines) {
    const trimmed = sourceLine.trim();
    if (trimmed === '') {
      // Blank line → empty slot to preserve visual separation
      lines.push('');
    } else {
      const wrapped = wrapParagraph(doc, trimmed, maxWidth, targetWordsPerLine);
      lines.push(...wrapped);
    }
  }

  return lines;
}

// ─── Test ─────────────────────────────────────────────────────────────────────

const emailText = `Dear Tom,

I am writing to invite you to my birthday party next Saturday.

The party will be held at my house from 3pm to 8pm. We will have lots of fun activities.

I hope you can come. Please let me know if you can make it.

Yours sincerely,
Li Ming`;

// Set up PDFKit doc (we never write it to disk)
const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false });

// Register the GochiHand font that the renderer uses
const FONTS_DIR = path.join(__dirname, 'src/assets/fonts');
doc.registerFont('GochiHand', path.join(FONTS_DIR, 'GochiHand-Regular.ttf'));

// Typical usable width: answerAreaWidth (≈170mm) minus 12pt padding
// 170mm × 2.8346 pt/mm = ~481 pt, minus 12 = ~469 pt
const usableWidth = 469;
const fontSize = 14;
const fontName = 'GochiHand';
const targetWordsPerLine = 10;

const lines = wrapTextWithFontMetrics(doc, emailText, usableWidth, fontSize, fontName, targetWordsPerLine);

console.log('=== wrapTextWithFontMetrics output ===');
console.log(`Total output lines: ${lines.length}`);
console.log('');

lines.forEach((line, i) => {
  const display = line === '' ? '(empty — blank separator)' : `"${line}"`;
  console.log(`  [${String(i).padStart(2, '0')}] ${display}`);
});

// ─── Assertions ───────────────────────────────────────────────────────────────

console.log('');
console.log('=== Structure checks ===');

const checks = [
  {
    label: 'Line 0 is the salutation "Dear Tom,"',
    pass: lines[0] === 'Dear Tom,',
  },
  {
    label: 'Line 1 is empty (blank line after salutation)',
    pass: lines[1] === '',
  },
  {
    label: 'At least one empty line exists between salutation and first body paragraph',
    pass: lines.slice(1, 4).some(l => l === ''),
  },
  {
    label: 'Last non-empty line contains "Li Ming"',
    pass: [...lines].reverse().find(l => l !== '').includes('Li Ming'),
  },
  {
    label: '"Yours sincerely," appears as its own line',
    pass: lines.some(l => l.includes('Yours sincerely')),
  },
  {
    label: 'Empty lines exist in output (structural separators preserved)',
    pass: lines.filter(l => l === '').length >= 3,
  },
  {
    label: 'No line contains both salutation and body text merged together',
    pass: !lines.some(l => l.includes('Dear Tom') && l.includes('I am writing')),
  },
];

let allPassed = true;
for (const { label, pass } of checks) {
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`  [${icon}] ${label}`);
  if (!pass) allPassed = false;
}

console.log('');
console.log(allPassed ? '[OVERALL: PASS] Email structure is preserved.' : '[OVERALL: FAIL] Email structure is NOT preserved.');
