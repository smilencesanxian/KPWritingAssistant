export const OCR_MIN_ACCURACY = 0.9;
export const OCR_MAX_REGRESSION = 0.05;

export type OcrProviderName = 'baidu' | 'tencent' | 'tal';

export interface OcrAccuracyMetrics {
  normalizedActual: string;
  normalizedExpected: string;
  compactActual: string;
  compactExpected: string;
  editDistance: number;
  compactEditDistance: number;
  accuracy: number;
  compactAccuracy: number;
  tokenPrecision: number;
  tokenRecall: number;
  tokenF1: number;
}

export interface OcrAccuracyBaselineEntry {
  accuracy: number;
  compactAccuracy?: number;
}

export interface OcrAccuracyBaseline {
  version: number;
  thresholds: {
    minAccuracy: number;
    maxRegression: number;
  };
  providers: Record<
    OcrProviderName,
    {
      averageAccuracy: number | null;
      samples: Record<string, OcrAccuracyBaselineEntry | null>;
    }
  >;
}

export interface OcrBenchmarkSampleResult extends OcrAccuracyMetrics {
  sampleId: string;
  sampleLabel: string;
  provider: OcrProviderName;
  status: 'passed' | 'failed' | 'skipped';
  actualText: string;
  expectedText: string;
  reason?: string;
}

export interface OcrBenchmarkProviderResult {
  provider: OcrProviderName;
  status: 'passed' | 'failed' | 'skipped';
  averageAccuracy: number | null;
  averageCompactAccuracy: number | null;
  sampleResults: OcrBenchmarkSampleResult[];
  skippedReason?: string;
}

export interface OcrBenchmarkReport {
  generatedAt: string;
  thresholds: {
    minAccuracy: number;
    maxRegression: number;
  };
  providers: OcrBenchmarkProviderResult[];
  issues: string[];
  evaluatedProviders: number;
}

export function normalizeOcrText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function compactOcrText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim();
}

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (left.length === 0) return right.length;
  if (right.length === 0) return left.length;

  const previous = new Array(right.length + 1);
  const current = new Array(right.length + 1);

  for (let column = 0; column <= right.length; column += 1) {
    previous[column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row;
    const leftChar = left[row - 1];

    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = leftChar === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + substitutionCost
      );
    }

    for (let column = 0; column <= right.length; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[right.length];
}

function safeAccuracy(distance: number, left: string, right: string): number {
  const denominator = Math.max(left.length, right.length);
  if (denominator === 0) return 1;
  return 1 - distance / denominator;
}

function tokenizeForAccuracy(text: string): string[] {
  return normalizeOcrText(text)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

export function calculateOcrAccuracy(actualText: string, expectedText: string): OcrAccuracyMetrics {
  const normalizedActual = normalizeOcrText(actualText);
  const normalizedExpected = normalizeOcrText(expectedText);
  const compactActual = compactOcrText(actualText);
  const compactExpected = compactOcrText(expectedText);

  const editDistance = levenshteinDistance(normalizedActual, normalizedExpected);
  const compactEditDistance = levenshteinDistance(compactActual, compactExpected);

  const actualTokens = tokenizeForAccuracy(actualText);
  const expectedTokens = tokenizeForAccuracy(expectedText);
  const tokenMatches = actualTokens.filter((token) => expectedTokens.includes(token)).length;

  const tokenPrecision = actualTokens.length === 0 ? 1 : tokenMatches / actualTokens.length;
  const tokenRecall = expectedTokens.length === 0 ? 1 : tokenMatches / expectedTokens.length;
  const tokenF1 =
    tokenPrecision + tokenRecall === 0
      ? 0
      : (2 * tokenPrecision * tokenRecall) / (tokenPrecision + tokenRecall);

  return {
    normalizedActual,
    normalizedExpected,
    compactActual,
    compactExpected,
    editDistance,
    compactEditDistance,
    accuracy: safeAccuracy(editDistance, normalizedActual, normalizedExpected),
    compactAccuracy: safeAccuracy(compactEditDistance, compactActual, compactExpected),
    tokenPrecision,
    tokenRecall,
    tokenF1,
  };
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return `${(value * 100).toFixed(digits)}%`;
}

export function compareAccuracy(
  currentAccuracy: number,
  baselineAccuracy: number | null | undefined
): number | null {
  if (baselineAccuracy === null || baselineAccuracy === undefined) {
    return null;
  }
  return currentAccuracy - baselineAccuracy;
}

export function buildOcrBenchmarkReport(params: {
  providers: OcrBenchmarkProviderResult[];
  thresholds?: {
    minAccuracy: number;
    maxRegression: number;
  };
}): OcrBenchmarkReport {
  const thresholds = params.thresholds ?? {
    minAccuracy: OCR_MIN_ACCURACY,
    maxRegression: OCR_MAX_REGRESSION,
  };

  const issues: string[] = [];
  let evaluatedProviders = 0;

  for (const provider of params.providers) {
    if (provider.status === 'skipped') {
      continue;
    }

    evaluatedProviders += 1;

    if (provider.averageAccuracy !== null && provider.averageAccuracy < thresholds.minAccuracy) {
      issues.push(
        `${provider.provider} 平均准确率 ${formatPercent(provider.averageAccuracy)} 低于阈值 ${formatPercent(
          thresholds.minAccuracy
        )}`
      );
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    thresholds,
    providers: params.providers,
    issues,
    evaluatedProviders,
  };
}

export function formatOcrBenchmarkReport(report: OcrBenchmarkReport): string {
  const lines: string[] = [];
  lines.push(`OCR benchmark summary (${report.generatedAt})`);
  lines.push(
    `Thresholds: min=${formatPercent(report.thresholds.minAccuracy)}, regression=${formatPercent(
      report.thresholds.maxRegression
    )}`
  );

  for (const provider of report.providers) {
    lines.push(`- ${provider.provider}: ${provider.status}`);
    if (provider.status === 'skipped') {
      lines.push(`  reason: ${provider.skippedReason ?? 'skipped'}`);
      continue;
    }

    lines.push(
      `  average accuracy: ${formatPercent(provider.averageAccuracy)}, compact: ${formatPercent(
        provider.averageCompactAccuracy
      )}`
    );

    for (const sample of provider.sampleResults) {
      const prefix = sample.status === 'passed' ? '✓' : sample.status === 'failed' ? '✗' : '-';
      lines.push(
        `  ${prefix} ${sample.sampleId}/${sample.provider}: accuracy=${formatPercent(
          sample.accuracy
        )}, compact=${formatPercent(sample.compactAccuracy)}, tokens=${sample.tokenF1.toFixed(3)}`
      );
      if (sample.reason) {
        lines.push(`    reason: ${sample.reason}`);
      }
    }
  }

  if (report.issues.length > 0) {
    lines.push('Issues:');
    for (const issue of report.issues) {
      lines.push(`- ${issue}`);
    }
  }

  return lines.join('\n');
}
