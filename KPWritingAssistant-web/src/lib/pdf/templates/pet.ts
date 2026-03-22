import type { CopybookTemplate } from '@/types/pdf';

export const petTemplate: CopybookTemplate = {
  id: 'pet',
  name: 'PET Writing',
  description: 'Cambridge PET (B1 Preliminary) 标准答题纸格式',
  pageWidth: 595.28,
  pageHeight: 841.89,
  answerAreaWidthMm: 170,
  linesPerPage: 18,
  lineHeight: 31.75, // 11.2mm × 2.8346 pt/mm
  headerText: 'Question 1',
  headerBgColor: '#b8b8b8',
  headerFontSize: 14,
  contentFontSize: 15,
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
