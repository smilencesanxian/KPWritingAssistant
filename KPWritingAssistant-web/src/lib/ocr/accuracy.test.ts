import {
  buildOcrBenchmarkReport,
  calculateOcrAccuracy,
  compactOcrText,
  formatOcrBenchmarkReport,
  levenshteinDistance,
  normalizeOcrText,
  OCR_MAX_REGRESSION,
  OCR_MIN_ACCURACY,
} from './accuracy';

describe('OCR accuracy helpers', () => {
  it('normalizes OCR text for comparison', () => {
    expect(normalizeOcrText('  Hello,\r\nWORLD  ')).toBe('hello, world');
    expect(normalizeOcrText('A\n\nB')).toBe('a b');
  });

  it('creates compact OCR text by stripping whitespace', () => {
    expect(compactOcrText(' A \n B \t C ')).toBe('abc');
  });

  it('calculates levenshtein distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', 'abc')).toBe(0);
  });

  it('calculates OCR accuracy metrics', () => {
    const metrics = calculateOcrAccuracy('Hello world', 'Hello brave world');

    expect(metrics.normalizedActual).toBe('hello world');
    expect(metrics.normalizedExpected).toBe('hello brave world');
    expect(metrics.accuracy).toBeGreaterThan(0.6);
    expect(metrics.compactAccuracy).toBeGreaterThan(0.6);
    expect(metrics.tokenRecall).toBeGreaterThan(0.5);
    expect(metrics.tokenF1).toBeGreaterThan(0.5);
  });

  it('formats benchmark reports and keeps threshold defaults', () => {
    const report = buildOcrBenchmarkReport({
      providers: [
        {
          provider: 'tal',
          status: 'passed',
          averageAccuracy: 0.93,
          averageCompactAccuracy: 0.95,
          sampleResults: [],
        },
        {
          provider: 'baidu',
          status: 'skipped',
          averageAccuracy: null,
          averageCompactAccuracy: null,
          sampleResults: [],
          skippedReason: 'missing credentials',
        },
      ],
    });

    expect(report.thresholds.minAccuracy).toBe(OCR_MIN_ACCURACY);
    expect(report.thresholds.maxRegression).toBe(OCR_MAX_REGRESSION);
    expect(report.issues).toHaveLength(0);
    expect(formatOcrBenchmarkReport(report)).toContain('OCR benchmark summary');
  });
});
