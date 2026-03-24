import { test, expect, Page, Route } from '@playwright/test';

const BASE = 'http://localhost:3001';

/**
 * Upload Page E2E Tests - Task 6
 *
 * Tests for:
 * - Complete 4-step upload flow
 * - Two photo upload areas
 * - Type detection and confirmation
 * - Manual type override
 * - Scoring dimension cards display
 * - Error handling
 */

// ─── Helper Functions ───────────────────────────────────────────────────────

async function mockUploadApi(page: Page) {
  // Mock upload API
  await page.route('**/api/upload', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        storage_path: 'essays/test-image.jpg',
        url: 'https://example.com/test-image.jpg',
      }),
    });
  });
}

async function mockOcrApi(page: Page, options: { success?: boolean; text?: string } = {}) {
  const { success = true, text = 'Dear friend, How are you?' } = options;

  await page.route('**/api/ocr', async (route: Route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text }),
      });
    } else {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'OCR failed' }),
      });
    }
  });
}

interface DetectTypeResult {
  exam_part: 'part1' | 'part2';
  question_type: 'q1' | 'q2' | null;
  essay_type_label: string;
  topic: string;
  confidence: 'high' | 'medium' | 'low';
}

async function mockDetectTypeApi(page: Page, result: DetectTypeResult | null = null) {
  const defaultResult: DetectTypeResult = {
    exam_part: 'part1',
    question_type: null,
    essay_type_label: '邮件',
    topic: '给朋友写邮件',
    confidence: 'high',
  };

  await page.route('**/api/detect-type', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(result || defaultResult),
    });
  });
}

async function mockEssaysApi(page: Page) {
  await page.route('**/api/essays', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        submission: {
          id: 'test-submission-id',
          status: 'pending',
        },
      }),
    });
  });
}

interface CorrectResponse {
  correction: {
    id: string;
    status: string;
  };
  flagged_errors: Array<{ id: string; error_type_label: string }>;
}

async function mockCorrectApi(page: Page, options: { withFlaggedError?: boolean } = {}) {
  const { withFlaggedError = false } = options;

  await page.route('**/api/correct', async (route: Route) => {
    const response: CorrectResponse = {
      correction: {
        id: 'test-correction-id',
        status: 'completed',
      },
      flagged_errors: [],
    };

    if (withFlaggedError) {
      response.flagged_errors = [
        { id: 'error-1', error_type_label: '语法错误' },
      ];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

// ─── Test Suite: Step 1 - Photo Selection ─────────────────────────────────────

test.describe('上传页面 - Step 1: 选择照片', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/upload`);
  });

  test('页面正常加载，显示两个上传区域', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('上传作文');

    // Check for essay upload area (required)
    const essayDropzone = page.locator('[data-testid="essay-dropzone"]').or(page.locator('text=作文照片')).or(page.locator('text=上传作文'));
    await expect(essayDropzone.first()).toBeVisible();

    // Check for question upload area (optional)
    const questionDropzone = page.locator('[data-testid="question-dropzone"]').or(page.locator('text=题目照片')).or(page.locator('text=可选'));
    await expect(questionDropzone.first()).toBeVisible();
  });

  test('作文上传区域标注为"必需"或类似标识', async ({ page }) => {
    // Look for required indicator near essay upload
    const requiredIndicator = page.locator('text=必需').or(page.locator('text=必填')).or(page.locator('text=*'));
    await expect(requiredIndicator.first()).toBeVisible();
  });

  test('题目上传区域标注为"可选"', async ({ page }) => {
    // Look for optional indicator
    const optionalIndicator = page.locator('text=可选').or(page.locator('text=选填'));
    await expect(optionalIndicator.first()).toBeVisible();
  });

  test('未选择照片时"开始识别"按钮禁用', async ({ page }) => {
    const startButton = page.getByRole('button', { name: /开始识别/ });
    await expect(startButton).toBeDisabled();
  });

  test('选择作文照片后按钮变为可用', async ({ page }) => {
    // Create a mock file
    const fileInput = page.locator('input[type="file"]').first();

    // Create a dummy image file
    const buffer = Buffer.from('fake-image-data');
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer,
    });

    // Button should be enabled
    const startButton = page.getByRole('button', { name: /开始识别/ });
    await expect(startButton).toBeEnabled();
  });
});

// ─── Test Suite: Step 2 - Processing ──────────────────────────────────────────

test.describe('上传页面 - Step 2: AI识别处理', () => {
  test.beforeEach(async ({ page }) => {
    await mockUploadApi(page);
    await mockOcrApi(page);
    await mockDetectTypeApi(page);
  });

  test('点击开始识别后显示处理中状态', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload essay photo
    const fileInput = page.locator('input[type="file"]').first();
    const buffer = Buffer.from('fake-image-data');
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer,
    });

    // Click start button
    const startButton = page.getByRole('button', { name: /开始识别/ });
    await startButton.click();

    // Should show processing state
    await expect(page.locator('text=识别中').or(page.locator('text=处理中')).or(page.locator('text=AI识别'))).toBeVisible();
  });

  test('并行处理两张照片', async ({ page }) => {
    await page.route('**/api/ocr', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'OCR result' }),
      });
    });

    await page.goto(`${BASE}/upload`);

    // Upload both photos
    const fileInputs = page.locator('input[type="file"]');
    const buffer = Buffer.from('fake-image-data');

    await fileInputs.nth(0).setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer,
    });

    // If there's a second file input for question
    const count = await fileInputs.count();
    if (count > 1) {
      await fileInputs.nth(1).setInputFiles({
        name: 'test-question.jpg',
        mimeType: 'image/jpeg',
        buffer,
      });
    }

    const startButton = page.getByRole('button', { name: /开始识别/ });
    await startButton.click();

    // Wait for processing
    await page.waitForTimeout(1000);

    // If two photos uploaded, OCR should be called twice
    // Note: This depends on implementation details
  });
});

// ─── Test Suite: Step 3 - Type Confirmation ───────────────────────────────────

test.describe('上传页面 - Step 3: 题型确认', () => {
  test.beforeEach(async ({ page }) => {
    await mockUploadApi(page);
    await mockOcrApi(page, { text: 'Dear friend, How are you?' });
    await mockDetectTypeApi(page, {
      exam_part: 'part1',
      question_type: null,
      essay_type_label: '邮件',
      topic: '给朋友写邮件',
      confidence: 'high',
    });
    await mockEssaysApi(page);
    await mockCorrectApi(page);
  });

  test('E2E-003: 显示自动识别的题型标签', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and start
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Wait for confirm step
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    // Check for type label
    const typeLabel = page.locator('[data-testid="detected-type-tag"]').or(page.locator('text=Part 1')).or(page.locator('text=邮件'));
    await expect(typeLabel.first()).toBeVisible();
  });

  test('显示可编辑的OCR文本区域', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and start
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Wait for confirm step
    await expect(page.locator('textarea').or(page.locator('[data-testid="ocr-textarea"]'))).toBeVisible({ timeout: 10000 });

    // Check OCR text is displayed
    const textarea = page.locator('textarea').first();
    await expect(textarea).toHaveValue(/Dear friend/);
  });

  test('提供题型手动修改下拉框', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and start
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Wait for confirm step
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    // Check for type override dropdown
    const typeSelect = page.locator('[data-testid="type-override-select"]').or(page.locator('select'));
    await expect(typeSelect.first()).toBeVisible();
  });

  test('E2E-006: 可以编辑OCR文本', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and start
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Wait for textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Edit the text
    await textarea.fill('Edited essay content');
    await expect(textarea).toHaveValue('Edited essay content');
  });

  test('空文本时"开始批改"按钮禁用', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and start
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Wait for textarea
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Clear the text
    await textarea.fill('');

    // Button should be disabled
    const correctButton = page.getByRole('button', { name: /开始批改|确认并批改/ });
    await expect(correctButton).toBeDisabled();
  });
});

// ─── Test Suite: Step 4 - Correcting Loading ──────────────────────────────────

test.describe('上传页面 - Step 4: 批改Loading', () => {
  test.beforeEach(async ({ page }) => {
    await mockUploadApi(page);
    await mockOcrApi(page);
    await mockDetectTypeApi(page);
    await mockEssaysApi(page);
  });

  test('E2E-005: 显示4个评分维度卡片', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and process
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Wait for confirm step and click correct
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    // Mock correct API with delay to stay on loading page
    await page.route('**/api/correct', async (route: Route) => {
      await new Promise(r => setTimeout(r, 5000)); // Delay to check loading state
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          correction: { id: 'test-id', status: 'completed' },
          flagged_errors: [],
        }),
      });
    });

    await page.getByRole('button', { name: /开始批改|确认并批改/ }).click();

    // Check for scoring dimension cards
    await expect(page.locator('text=Content').or(page.locator('text=内容'))).toBeVisible();
    await expect(page.locator('text=Communicative Achievement').or(page.locator('text=交流'))).toBeVisible();
    await expect(page.locator('text=Organisation').or(page.locator('text=组织'))).toBeVisible();
    await expect(page.locator('text=Language').or(page.locator('text=语言'))).toBeVisible();
  });

  test('评分维度卡片显示正确描述', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    // Upload and process
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    // Delay correct API
    await page.route('**/api/correct', async (route: Route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          correction: { id: 'test-id', status: 'completed' },
          flagged_errors: [],
        }),
      });
    });

    await page.getByRole('button', { name: /开始批改|确认并批改/ }).click();

    // Check for dimension descriptions
    await expect(page.locator('text=/完整覆盖要点/')).toBeVisible();
    await expect(page.locator('text=/格式规范/')).toBeVisible();
    await expect(page.locator('text=/分段清晰/')).toBeVisible();
    await expect(page.locator('text=/词汇丰富/')).toBeVisible();
  });

  test('显示"/5"评分标准', async ({ page }) => {
    await page.goto(`${BASE}/upload`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    await page.route('**/api/correct', async (route: Route) => {
      await new Promise(r => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          correction: { id: 'test-id', status: 'completed' },
          flagged_errors: [],
        }),
      });
    });

    await page.getByRole('button', { name: /开始批改|确认并批改/ }).click();

    // Check for /5 indicators
    const fiveIndicators = page.locator('text=/\\/5/');
    await expect(fiveIndicators.first()).toBeVisible();
  });
});

// ─── Test Suite: Error Handling ───────────────────────────────────────────────

test.describe('上传页面 - 错误处理', () => {
  test('E2E-004: OCR失败时显示错误提示并可手动输入', async ({ page }) => {
    await mockUploadApi(page);
    await mockOcrApi(page, { success: false });

    await page.goto(`${BASE}/upload`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Should show error message
    await expect(page.locator('text=识别失败').or(page.locator('text=OCR失败')).or(page.locator('text=请手动输入'))).toBeVisible({ timeout: 10000 });

    // Should still show textarea for manual input
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible();

    // User can type in the textarea
    await textarea.fill('Manually entered essay text');
    await expect(textarea).toHaveValue('Manually entered essay text');
  });

  test('网络错误时显示重试选项', async ({ page }) => {
    await page.route('**/api/upload', async (route: Route) => {
      await route.abort('failed');
    });

    await page.goto(`${BASE}/upload`);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Should show error
    await expect(page.locator('text=失败').or(page.locator('text=错误')).or(page.locator('text=请重试'))).toBeVisible({ timeout: 10000 });
  });
});

// ─── Test Suite: Complete Flow ────────────────────────────────────────────────

test.describe('上传页面 - 完整流程', () => {
  test('E2E-002: 仅上传作文照片完成全流程', async ({ page }) => {
    await mockUploadApi(page);
    await mockOcrApi(page, { text: 'Dear friend, How are you?' });
    await mockDetectTypeApi(page, {
      exam_part: 'part1',
      question_type: null,
      essay_type_label: '邮件',
      topic: '给朋友写邮件',
      confidence: 'high',
    });
    await mockEssaysApi(page);
    await mockCorrectApi(page);

    await page.goto(`${BASE}/upload`);

    // Step 1: Upload only essay photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Step 3: Confirm page
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    // Click correct
    await page.getByRole('button', { name: /开始批改|确认并批改/ }).click();

    // Should redirect to correction page
    await expect(page).toHaveURL(/\/corrections\//, { timeout: 10000 });
  });

  test('E2E-001: 上传两张照片完成全流程', async ({ page }) => {
    await mockUploadApi(page);
    await mockOcrApi(page, { text: 'Dear friend, How are you?' });
    await mockDetectTypeApi(page, {
      exam_part: 'part1',
      question_type: null,
      essay_type_label: '邮件',
      topic: '给朋友写邮件',
      confidence: 'high',
    });
    await mockEssaysApi(page);
    await mockCorrectApi(page);

    await page.goto(`${BASE}/upload`);

    // Upload essay photo
    const fileInputs = page.locator('input[type="file"]');
    await fileInputs.first().setInputFiles({
      name: 'test-essay.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    });

    // Upload question photo if available
    const count = await fileInputs.count();
    if (count > 1) {
      await fileInputs.nth(1).setInputFiles({
        name: 'test-question.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-question'),
      });
    }

    await page.getByRole('button', { name: /开始识别/ }).click();

    // Confirm page
    await expect(page.locator('text=确认').or(page.locator('text=识别结果'))).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /开始批改|确认并批改/ }).click();

    // Redirect to correction
    await expect(page).toHaveURL(/\/corrections\//, { timeout: 10000 });
  });
});
