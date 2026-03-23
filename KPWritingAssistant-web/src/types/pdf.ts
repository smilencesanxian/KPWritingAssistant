export interface CopybookOptions {
  fontStyle?: string;
}

export type CopybookMode = 'tracing' | 'dictation';

export interface CopybookTemplate {
  id: string;
  name: string;
  description: string;
  // Page dimensions in points (A4 = 595.28 x 841.89)
  pageWidth: number;
  pageHeight: number;
  // Answer area
  answerAreaWidthMm: number; // in mm, centered on page
  linesPerPage: number;
  lineHeight: number; // in points
  // Header
  headerText: string;
  headerBgColor: string;
  headerFontSize: number;
  // Content font
  contentFontSize: number;
  // Font size options (min, max, default in points)
  minFontSize: number;
  maxFontSize: number;
  defaultFontSize: number;
  // Top instructions text lines
  topInstructions: string[];
  // Decorative elements
  showCornerMarks: boolean;
  showCambridgeWatermark: boolean;
  showExaminerTable: boolean;
  examinerColumns: string[];
  showBarcode: boolean;
}
