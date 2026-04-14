import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { test, expect, type Page } from '@playwright/test';
import { cleanOcrText } from '../src/lib/ocr';
import { recognizeHandwriting as recognizeBaidu } from '../src/lib/ocr/baidu';
import { recognizeHandwriting as recognizeTencent } from '../src/lib/ocr/tencent';
import { recognizeHandwriting as recognizeTal } from '../src/lib/ocr/tal';
import {
  buildOcrBenchmarkReport,
  calculateOcrAccuracy,
  formatOcrBenchmarkReport,
  formatPercent,
  compactOcrText,
  normalizeOcrText,
  OCR_MAX_REGRESSION,
  OCR_MIN_ACCURACY,
  type OcrAccuracyBaseline,
  type OcrBenchmarkProviderResult,
  type OcrBenchmarkSampleResult,
  type OcrProviderName,
} from '../src/lib/ocr/accuracy';

const RUN_BENCHMARK = process.env.RUN_OCR_ACCURACY === '1';
const FIXTURE_DIR = resolve(process.cwd(), 'e2e/fixtures');
const BASELINE_PATH = resolve(process.cwd(), 'e2e/ocr-accuracy.baseline.json');

interface BenchmarkSample {
  id: string;
  label: string;
  imagePath: string;
  expectedPath: string;
}

interface ProviderDefinition {
  provider: OcrProviderName;
  label: string;
  isConfigured: () => boolean;
  recognize: (imageBase64: string) => Promise<{ text: string; confidence: number }>;
}

const samples: BenchmarkSample[] = [
  {
    id: 'ket',
    label: 'KET 手写样例',
    imagePath: resolve(FIXTURE_DIR, 'ket作文手写样例.jpg'),
    expectedPath: resolve(FIXTURE_DIR, 'ket作文手写样例预期识别结果.txt'),
  },
  {
    id: 'pet',
    label: 'PET 手写样例',
    imagePath: resolve(FIXTURE_DIR, 'pet作文手写样例.jpg'),
    expectedPath: resolve(FIXTURE_DIR, 'pet作文手写样例预期识别结果.txt'),
  },
];

const providers: ProviderDefinition[] = [
  {
    provider: 'baidu',
    label: '百度 OCR',
    isConfigured: () => !!(process.env.BAIDU_OCR_API_KEY && process.env.BAIDU_OCR_SECRET_KEY),
    recognize: recognizeBaidu,
  },
  {
    provider: 'tencent',
    label: '腾讯 OCR',
    isConfigured: () => !!(process.env.TENCENT_SECRET_ID && process.env.TENCENT_SECRET_KEY),
    recognize: recognizeTencent,
  },
  {
    provider: 'tal',
    label: '好未来 OCR',
    isConfigured: () => !!(process.env.TAL_ACCESS_KEY_ID && process.env.TAL_ACCESS_KEY_SECRET),
    recognize: recognizeTal,
  },
];

function readExpectedText(sample: BenchmarkSample): string {
  return readFileSync(sample.expectedPath, 'utf-8').trim();
}

function readImageBase64(sample: BenchmarkSample): string {
  return readFileSync(sample.imagePath).toString('base64');
}

async function compressImageBase64(
  page: Page,
  imageBase64: string
): Promise<{
  compressedBase64: string;
  originalWidth: number;
  originalHeight: number;
  compressedWidth: number;
  compressedHeight: number;
}> {
  return await page.evaluate(async (sourceBase64: string) => {
    const loadImage = async (dataUrl: string) => {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('failed to load image'));
        image.src = dataUrl;
      });
      return image;
    };

    const image = await loadImage(`data:image/jpeg;base64,${sourceBase64}`);
    const originalWidth = image.width;
    const originalHeight = image.height;
    const maxDimension = 1920;
    const quality = 0.9;

    let width = image.width;
    let height = image.height;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('failed to create canvas context');
    }
    context.drawImage(image, 0, 0, width, height);
    const compressedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];

    return {
      compressedBase64,
      originalWidth,
      originalHeight,
      compressedWidth: width,
      compressedHeight: height,
    };
  }, imageBase64);
}

function loadBaseline(): OcrAccuracyBaseline | null {
  if (!existsSync(BASELINE_PATH)) {
    return null;
  }

  return JSON.parse(readFileSync(BASELINE_PATH, 'utf-8')) as OcrAccuracyBaseline;
}

function buildProviderResult(
  provider: OcrProviderName,
  sampleResults: OcrBenchmarkSampleResult[],
  skippedReason?: string
): OcrBenchmarkProviderResult {
  const evaluated = sampleResults.filter((sample) => sample.status !== 'skipped');
  const averageAccuracy =
    evaluated.length === 0
      ? null
      : evaluated.reduce((sum, sample) => sum + sample.accuracy, 0) / evaluated.length;
  const averageCompactAccuracy =
    evaluated.length === 0
      ? null
      : evaluated.reduce((sum, sample) => sum + sample.compactAccuracy, 0) / evaluated.length;

  return {
    provider,
    status: skippedReason ? 'skipped' : sampleResults.some((sample) => sample.status === 'failed') ? 'failed' : 'passed',
    averageAccuracy,
    averageCompactAccuracy,
    sampleResults,
    skippedReason,
  };
}

function buildRegressionIssues(
  providerResult: OcrBenchmarkProviderResult,
  baseline: OcrAccuracyBaseline | null
): string[] {
  if (!baseline) {
    return [];
  }

  const baselineProvider = baseline.providers[providerResult.provider];
  if (!baselineProvider) {
    return [];
  }

  const issues: string[] = [];
  const baselineAverage = baselineProvider.averageAccuracy;
  if (providerResult.averageAccuracy !== null && baselineAverage !== null) {
    const delta = providerResult.averageAccuracy - baselineAverage;
    if (delta < -OCR_MAX_REGRESSION) {
      issues.push(
        `${providerResult.provider} 平均准确率从 ${formatPercent(baselineAverage)} 降到 ${formatPercent(
          providerResult.averageAccuracy
        )}，下降 ${formatPercent(Math.abs(delta))}，超过阈值 ${formatPercent(OCR_MAX_REGRESSION)}`
      );
    }
  }

  for (const sample of providerResult.sampleResults) {
    if (sample.status === 'skipped') {
      continue;
    }

    const baselineSample = baselineProvider.samples[sample.sampleId];
    if (baselineSample?.accuracy !== undefined) {
      const delta = sample.accuracy - baselineSample.accuracy;
      if (delta < -OCR_MAX_REGRESSION) {
        issues.push(
          `${providerResult.provider}/${sample.sampleId} 准确率从 ${formatPercent(
            baselineSample.accuracy
          )} 降到 ${formatPercent(sample.accuracy)}，下降 ${formatPercent(Math.abs(delta))}，超过阈值 ${formatPercent(
            OCR_MAX_REGRESSION
          )}`
        );
      }
    }

    if (sample.accuracy < OCR_MIN_ACCURACY) {
      issues.push(
        `${providerResult.provider}/${sample.sampleId} 准确率 ${formatPercent(sample.accuracy)} 低于阈值 ${formatPercent(
          OCR_MIN_ACCURACY
        )}`
      );
    }
  }

  return issues;
}

test.describe('OCR accuracy benchmark', () => {
  test.skip(!RUN_BENCHMARK, '默认跳过 OCR 准确率基准测试；运行前请设置 RUN_OCR_ACCURACY=1');

  test('OCR-ACCURACY-001: 评估 3 个 OCR 接口在手写样本上的准确率', async ({ page }) => {
    const baseline = loadBaseline();
    const preparedSamples = await Promise.all(
      samples.map(async (sample) => {
        const imageBase64 = readImageBase64(sample);
        const compressed = await compressImageBase64(page, imageBase64);
        return {
          ...sample,
          expectedText: cleanOcrText(readExpectedText(sample)),
          ...compressed,
        };
      })
    );

    const providerResults: OcrBenchmarkProviderResult[] = [];

    for (const provider of providers) {
      if (!provider.isConfigured()) {
        providerResults.push(
          buildProviderResult(provider.provider, [], `${provider.label} 未配置，已跳过`)
        );
        continue;
      }

      const sampleResults: OcrBenchmarkSampleResult[] = [];

      for (const sample of preparedSamples) {
        try {
          const result = await provider.recognize(sample.compressedBase64);
          const actualText = cleanOcrText(result.text);
          const metrics = calculateOcrAccuracy(actualText, sample.expectedText);
          sampleResults.push({
            ...metrics,
            sampleId: sample.id,
            sampleLabel: sample.label,
            provider: provider.provider,
            status: metrics.accuracy >= OCR_MIN_ACCURACY ? 'passed' : 'failed',
            actualText,
            expectedText: sample.expectedText,
            reason:
              metrics.accuracy >= OCR_MIN_ACCURACY
                ? undefined
                : `准确率 ${formatPercent(metrics.accuracy)} 低于阈值 ${formatPercent(OCR_MIN_ACCURACY)}`,
          });
        } catch (error) {
          sampleResults.push({
            sampleId: sample.id,
            sampleLabel: sample.label,
            provider: provider.provider,
            status: 'failed',
            actualText: '',
            expectedText: sample.expectedText,
            normalizedActual: '',
            normalizedExpected: normalizeOcrText(sample.expectedText),
            compactActual: '',
            compactExpected: compactOcrText(sample.expectedText),
            editDistance: 0,
            compactEditDistance: 0,
            accuracy: 0,
            compactAccuracy: 0,
            tokenPrecision: 0,
            tokenRecall: 0,
            tokenF1: 0,
            reason: error instanceof Error ? error.message : 'OCR 调用失败',
          });
        }
      }

      providerResults.push(buildProviderResult(provider.provider, sampleResults));
    }

    const report = buildOcrBenchmarkReport({
      providers: providerResults,
      thresholds: {
        minAccuracy: OCR_MIN_ACCURACY,
        maxRegression: OCR_MAX_REGRESSION,
      },
    });

    const regressionIssues = providerResults.flatMap((providerResult) =>
      buildRegressionIssues(providerResult, baseline)
    );
    report.issues.push(...regressionIssues);

    console.log(
      [
        formatOcrBenchmarkReport(report),
        '',
        'Samples:',
        ...preparedSamples.map(
          (sample) =>
            `- ${sample.id}: ${sample.originalWidth}x${sample.originalHeight} -> ${sample.compressedWidth}x${sample.compressedHeight}`
        ),
      ].join('\n')
    );

    const evaluatedProviders = providerResults.filter((provider) => provider.status !== 'skipped');
    expect(evaluatedProviders.length, '至少需要成功评测一个已配置的 OCR 接口').toBeGreaterThan(0);
    expect(report.issues, `OCR 准确率基准未通过：\n${formatOcrBenchmarkReport(report)}`).toHaveLength(0);
  });
});
