/**
 * PET Writing Answer Sheet Templates
 *
 * These templates replicate the official Cambridge PET answer sheet layout.
 * Reference HTML files: src/assets/PET作文part1答题纸.html (Part 1)
 *                       src/assets/PET作文part2答题纸.html (Part 2)
 *
 * When the HTML templates are updated, update the corresponding TypeScript
 * template fields below to match (line count, heights, colors, header style).
 */
import type { CopybookTemplate } from '@/types/pdf';

export const petTemplate: CopybookTemplate = {
  id: 'pet',
  name: 'PET Writing Part 1',
  description: 'Cambridge PET (B1 Preliminary) Part 1 邮件标准答题纸格式',
  pageWidth: 595.28,
  pageHeight: 841.89,
  answerAreaWidthMm: 170,
  linesPerPage: 18,
  lineHeight: 31.75, // 11.2mm × 2.8346 pt/mm
  headerText: 'Question 1',
  headerBgColor: '#b8b8b8',
  headerFontSize: 14,
  headerType: 'question1',
  borderColor: '#000000',
  contentFontSize: 18,
  minFontSize: 12,
  maxFontSize: 22,
  defaultFontSize: 18,
  topInstructions: [
    'You must write within the grey lines.',
    'Write your answer for Part 1 below. Do not write on the barcodes.',
  ],
  showCornerMarks: true,
  showCambridgeWatermark: true,
  showExaminerTable: true,
  examinerColumns: ['C', 'CA', 'O', 'L'],
  showBarcode: true,
};

export const petPart2Template: CopybookTemplate = {
  id: 'pet-part2',
  name: 'PET Writing Part 2',
  description: 'Cambridge PET (B1 Preliminary) Part 2 文章/故事标准答题纸格式',
  pageWidth: 595.28,
  pageHeight: 841.89,
  answerAreaWidthMm: 170,
  linesPerPage: 17,
  lineHeight: 29.76, // 10.5mm × 2.8346 pt/mm
  headerText: 'Part 2',
  headerBgColor: '#f9f9f9',
  headerFontSize: 11,
  headerType: 'part2-selector',
  borderColor: '#dddddd',
  contentFontSize: 18,
  minFontSize: 12,
  maxFontSize: 22,
  defaultFontSize: 18,
  topInstructions: [
    'You must write within the grey lines.',
    'Answer only one of the two questions for Part 2.',
    'Tick (✓) the box to show which question you have answered.',
    'Write your answer below. Do not write on the barcodes.',
  ],
  showCornerMarks: true,
  showCambridgeWatermark: true,
  showExaminerTable: true,
  examinerColumns: ['C', 'CA', 'O', 'L'],
  showBarcode: false,
};
