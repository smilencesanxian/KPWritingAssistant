import { test, expect, Browser } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:3000';
const FIXTURES = path.join(__dirname, 'fixtures');
const OCR_TIMEOUT = 30_000;
const CORRECT_TIMEOUT = 120_000;
const USER_ID = '00000000-0000-0000-0000-000000000001';
const EDIT_MARKER = 'E2E SAVE COPYBOOK MARKER';

async function runUploadFlow(browser: Browser): Promise<string> {
  const context = await browser.newContext();
  await context.addCookies([{ name: 'x-e2e-user-id', value: USER_ID, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/upload`);

    const essayInput = page.locator('[data-testid="essay-dropzone"] input[type="file"]');
    await essayInput.setInputFiles(path.join(FIXTURES, 'part1-essay.jpg'));
    await expect(page.locator('p:has-text("part1-essay.jpg")')).toBeVisible({ timeout: 5000 });

    const questionInput = page.locator('[data-testid="question-dropzone"] input[type="file"]');
    await questionInput.setInputFiles(path.join(FIXTURES, 'part1-question.jpg'));
    await expect(page.locator('p:has-text("part1-question.jpg")')).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: '开始识别' }).click();
    await expect(page.locator('h1', { hasText: '确认识别内容' })).toBeVisible({ timeout: OCR_TIMEOUT });

    await page.getByRole('button', { name: '开始批改' }).click();
    await page.waitForURL(/\/corrections\/[a-zA-Z0-9-]+/, { timeout: CORRECT_TIMEOUT });

    return page.url().split('/corrections/')[1].split('?')[0];
  } finally {
    await context.close();
  }
}

test.describe('真实链路: 编辑范文后生成字帖', () => {
  let correctionId: string;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(180_000);
    correctionId = await runUploadFlow(browser);
  });

  test('EDIT-COPYBOOK-001: 保存编辑后的范文后可成功生成字帖', async ({ page }) => {
    test.setTimeout(180_000);

    await page.context().addCookies([{ name: 'x-e2e-user-id', value: USER_ID, domain: 'localhost', path: '/' }]);
    await page.goto(`${BASE}/corrections/${correctionId}`);

    await expect(page.locator('[data-testid="model-essay"]')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-testid="edit-essay-button"]')).toBeVisible({ timeout: 30_000 });

    await page.locator('[data-testid="edit-essay-button"]').click();
    const textarea = page.locator('[data-testid="edit-essay-textarea"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const originalText = await textarea.inputValue();
    const updatedText = `${originalText}\n\n${EDIT_MARKER}`;
    await textarea.fill(updatedText);

    const saveResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/model-essays/') && res.request().method() === 'PUT',
      { timeout: 20_000 }
    );

    await page.locator('[data-testid="save-edit-button"]').click();
    const saveResponse = await saveResponsePromise;
    const saveBody = await saveResponse.json() as {
      model_essay?: { user_edited_content?: string; is_user_edited?: boolean };
    };

    expect(saveResponse.status(), '保存范文应成功（2xx）').toBeLessThan(300);
    expect(saveBody.model_essay?.user_edited_content).toContain(EDIT_MARKER);
    expect(saveBody.model_essay?.is_user_edited).toBe(true);

    await expect(page.locator('[data-testid="user-edited-badge"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="model-essay"]')).toContainText(EDIT_MARKER);

    const generateResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/generate/copybook') && res.request().method() === 'POST',
      { timeout: 30_000 }
    );

    await page.getByRole('button', { name: '生成字帖' }).click();
    const generateResponse = await generateResponsePromise;
    const generateBody = await generateResponse.json() as {
      copybook?: { id?: string };
    };

    expect(generateResponse.status(), '生成字帖应成功（2xx）').toBeLessThan(300);
    expect(generateBody.copybook?.id, '生成字帖应返回有效 copybook id').toBeTruthy();

    await page.waitForURL(new RegExp(`/copybook/${generateBody.copybook?.id}$`), { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: '字帖预览' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: '下载 PDF' })).toBeVisible({ timeout: 10_000 });

    const downloadResult = await page.evaluate(async (copybookId: string) => {
      const res = await fetch(`/api/copybooks/${copybookId}/download`);
      return {
        status: res.status,
        contentType: res.headers.get('content-type'),
      };
    }, generateBody.copybook!.id!);

    expect(downloadResult.status, '下载字帖接口应成功').toBeLessThan(300);
    expect(downloadResult.contentType).toContain('application/pdf');
  });
});
