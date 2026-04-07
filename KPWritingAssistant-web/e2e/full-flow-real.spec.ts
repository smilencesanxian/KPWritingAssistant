import { test, expect, Browser } from '@playwright/test';
import path from 'path';

/**
 * 真实全流程 E2E 测试
 *
 * 使用真实图片走完完整批改流程：
 * 上传作文 → OCR识别 → 确认内容 → AI批改 → 批改结果页 → 重新生成范文弹窗
 *
 * 依赖：
 * - e2e/fixtures/part1-essay.jpg / part1-question.jpg
 * - e2e/fixtures/part2-essay.jpg / part2-question.jpg
 * - .env.local 中配置了 OCR + LLM API Key
 * - E2E_BYPASS_AUTH=true
 */

const BASE = 'http://localhost:3000';
const FIXTURES = path.join(__dirname, 'fixtures');

const OCR_TIMEOUT = 30_000;
const CORRECT_TIMEOUT = 120_000;

async function runUploadFlow(browser: Browser, userId: string, essayFile: string, questionFile: string): Promise<string> {
  const context = await browser.newContext();
  await context.addCookies([{ name: 'x-e2e-user-id', value: userId, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/upload`);

    // 上传作文图片
    const essayInput = page.locator('[data-testid="essay-dropzone"] input[type="file"]');
    await essayInput.setInputFiles(path.join(FIXTURES, essayFile));
    await expect(page.locator(`p:has-text("${essayFile}")`)).toBeVisible({ timeout: 5000 });

    // 上传题目图片
    const questionInput = page.locator('[data-testid="question-dropzone"] input[type="file"]');
    await questionInput.setInputFiles(path.join(FIXTURES, questionFile));
    await expect(page.locator(`p:has-text("${questionFile}")`)).toBeVisible({ timeout: 5000 });

    // 开始识别
    await page.getByRole('button', { name: '开始识别' }).click();

    // 等待 OCR 完成，进入确认页
    await expect(page.locator('h1', { hasText: '确认识别内容' })).toBeVisible({ timeout: OCR_TIMEOUT });
    await expect(page.locator('[data-testid="ocr-textarea"]')).toBeVisible();
    await expect(page.locator('[data-testid="detected-type-tag"]')).toBeVisible();

    // 开始批改
    await page.getByRole('button', { name: '开始批改' }).click();

    // 等待批改完成，URL 跳转到 /corrections/[id]
    await page.waitForURL(/\/corrections\/[a-zA-Z0-9-]+/, { timeout: CORRECT_TIMEOUT });

    const correctionId = page.url().split('/corrections/')[1].split('?')[0];
    return correctionId;
  } finally {
    await context.close();
  }
}

// ─── Part 1 完整流程 ──────────────────────────────────────────────────────────

test.describe('Part1 完整批改流程（邮件类）', () => {
  let correctionId: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    correctionId = await runUploadFlow(browser, '00000000-0000-0000-0000-000000000001', 'part1-essay.jpg', 'part1-question.jpg');
  });

  test('FLOW-001: 上传 Part1 作文完成批改，获得有效 correction ID', async () => {
    expect(correctionId).toBeTruthy();
    expect(correctionId).toMatch(/^[a-zA-Z0-9-]+$/);
  });

  test('FLOW-002: 批改结果页 - 评分表格显示', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  });

  test('FLOW-003: 批改结果页 - 范文示例区域显示', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);
    await expect(page.locator('[data-testid="model-essay"]')).toBeVisible({ timeout: 10000 });
  });

  test('FLOW-003B: 范文字数在合理范围内（60-150词，PET Part1 邮件）', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    // 等待范文生成完毕（loading 消失）
    await expect(page.locator('[data-testid="model-essay"]')).toBeVisible({ timeout: 30000 });

    // 读取页面显示的词数（"共 N 词"）
    const wordCountText = await page.locator('p:has-text("共") >> text=/共 \\d+ 词/').first().textContent({ timeout: 10000 });
    const match = wordCountText?.match(/共\s+(\d+)\s+词/);
    expect(match, `找不到词数显示，实际文本：${wordCountText}`).toBeTruthy();

    const wordCount = parseInt(match![1], 10);
    expect(wordCount, `范文字数 ${wordCount} 超出 PET Part1 范围（60-150词）`).toBeGreaterThanOrEqual(60);
    expect(wordCount, `范文字数 ${wordCount} 超出 PET Part1 范围（60-150词）`).toBeLessThanOrEqual(150);
  });

  test('FLOW-003C: 编辑范文并保存成功（无报错）', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    // 等待范文区域加载
    await expect(page.locator('[data-testid="edit-essay-button"]')).toBeVisible({ timeout: 30000 });
    await page.locator('[data-testid="edit-essay-button"]').click();

    // 编辑模态框打开
    await expect(page.locator('[data-testid="edit-essay-textarea"]')).toBeVisible({ timeout: 5000 });

    // 修改内容（追加标记，方便验证是否保存）
    const textarea = page.locator('[data-testid="edit-essay-textarea"]');
    const original = await textarea.inputValue();
    await textarea.fill(original + ' [E2E-edit]');

    // 监听 API 响应
    const saveResponsePromise = page.waitForResponse(
      res => res.url().includes('/api/model-essays/') && res.request().method() === 'PUT',
      { timeout: 10000 }
    );

    await page.locator('[data-testid="save-edit-button"]').click();
    const saveResponse = await saveResponsePromise;

    // 关键断言：保存请求成功（2xx），无报错
    expect(saveResponse.status(), '保存范文应成功（2xx）').toBeLessThan(300);

    // 确认错误提示未出现
    await expect(page.locator('[data-testid="edit-error"]')).not.toBeVisible();
  });

  test('FLOW-004: 重新生成弹窗 - 打开后输入偏好并触发 API', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    const regenerateBtn = page.locator('[data-testid="regenerate-essay-button"]');
    await expect(regenerateBtn).toBeVisible({ timeout: 10000 });
    await regenerateBtn.click();

    await expect(page.locator('[data-testid="regenerate-sheet"]')).toBeVisible({ timeout: 5000 });

    const preferenceInput = page.locator('[data-testid="preference-input"]');
    await preferenceInput.fill('更正式一些，使用更丰富的词汇');
    await expect(preferenceInput).toHaveValue('更正式一些，使用更丰富的词汇');

    const apiCallPromise = page.waitForRequest(
      req => req.url().includes('/api/model-essays/') && req.url().includes('/regenerate') && req.method() === 'POST',
      { timeout: 5000 }
    );
    await page.locator('[data-testid="regenerate-button"]').click();
    const apiCall = await apiCallPromise;
    expect(apiCall.postData()).toContain('preference_notes');
    expect(apiCall.postData()).toContain('更正式一些，使用更丰富的词汇');
  });

  test('FLOW-005: 重新生成弹窗 - 空输入也能触发提交', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    const regenerateBtn = page.locator('[data-testid="regenerate-essay-button"]');
    await expect(regenerateBtn).toBeVisible({ timeout: 10000 });
    await regenerateBtn.click();

    await expect(page.locator('[data-testid="regenerate-sheet"]')).toBeVisible();
    const submitBtn = page.locator('[data-testid="regenerate-button"]');
    await expect(submitBtn).toBeEnabled();

    const apiCallPromise = page.waitForRequest(
      req => req.url().includes('/api/model-essays/') && req.url().includes('/regenerate') && req.method() === 'POST',
      { timeout: 5000 }
    );
    await submitBtn.click();
    const apiCall = await apiCallPromise;
    expect(apiCall.postData()).toContain('preference_notes');
  });

  test('FLOW-006: 重新生成弹窗 - 点击取消关闭', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    const regenerateBtn = page.locator('[data-testid="regenerate-essay-button"]');
    await expect(regenerateBtn).toBeVisible({ timeout: 10000 });
    await regenerateBtn.click();

    await expect(page.locator('[data-testid="regenerate-sheet"]')).toBeVisible();
    await page.getByText('取消').click();
    await expect(page.locator('[data-testid="regenerate-sheet"]')).not.toBeVisible();
  });

  test('FLOW-007: 重新生成弹窗 - 点击遮罩层关闭', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    const regenerateBtn = page.locator('[data-testid="regenerate-essay-button"]');
    await expect(regenerateBtn).toBeVisible({ timeout: 10000 });
    await regenerateBtn.click();

    await expect(page.locator('[data-testid="regenerate-sheet"]')).toBeVisible();
    await page.locator('[data-testid="regenerate-sheet-backdrop"]').click();
    await expect(page.locator('[data-testid="regenerate-sheet"]')).not.toBeVisible();
  });
});

// ─── Part 2 完整流程 ──────────────────────────────────────────────────────────

test.describe('Part2 完整批改流程（文章/故事类）', () => {
  let correctionId: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    correctionId = await runUploadFlow(browser, '00000000-0000-0000-0000-000000000002', 'part2-essay.jpg', 'part2-question.jpg');
  });

  test('FLOW-008: 上传 Part2 作文完成批改，获得有效 correction ID', async () => {
    expect(correctionId).toBeTruthy();
    expect(correctionId).toMatch(/^[a-zA-Z0-9-]+$/);
  });

  test('FLOW-009: Part2 批改结果页 - 评分表格显示', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000002', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
  });

  test('FLOW-010: Part2 批改结果页 - 范文示例区域显示', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000002', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);
    await expect(page.locator('[data-testid="model-essay"]')).toBeVisible({ timeout: 10000 });
  });

  test('FLOW-011: Part2 重新生成范文弹窗正常打开', async ({ page }) => {
    await page.context().addCookies([{ name: 'x-e2e-user-id', value: '00000000-0000-0000-0000-000000000002', domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    const regenerateBtn = page.locator('[data-testid="regenerate-essay-button"]');
    await expect(regenerateBtn).toBeVisible({ timeout: 10000 });
    await regenerateBtn.click();

    await expect(page.locator('[data-testid="regenerate-sheet"]')).toBeVisible();

    const preferenceInput = page.locator('[data-testid="preference-input"]');
    await preferenceInput.fill('加入更多描述性语言');
    await expect(preferenceInput).toHaveValue('加入更多描述性语言');

    // 关闭弹窗
    await page.locator('[data-testid="regenerate-sheet-close"]').click();
    await expect(page.locator('[data-testid="regenerate-sheet"]')).not.toBeVisible();
  });
});
