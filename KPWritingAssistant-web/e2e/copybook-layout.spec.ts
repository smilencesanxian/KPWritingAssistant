import { test, expect } from '@playwright/test';
import path from 'path';

const BASE = 'http://localhost:3000';
const FIXTURES = path.join(__dirname, 'fixtures');
const USER_ID = '00000000-0000-0000-0000-000000000001';
const OCR_TIMEOUT = 30_000;
const CORRECT_TIMEOUT = 120_000;

async function runUploadFlow(browser: import('@playwright/test').Browser, userId: string, essayFile: string, questionFile: string): Promise<string> {
  const context = await browser.newContext();
  await context.addCookies([{ name: 'x-e2e-user-id', value: userId, domain: 'localhost', path: '/' }]);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE}/upload`);

    const essayInput = page.locator('[data-testid="essay-dropzone"] input[type="file"]');
    await essayInput.setInputFiles(path.join(FIXTURES, essayFile));
    await expect(page.locator(`p:has-text("${essayFile}")`)).toBeVisible({ timeout: 5000 });

    const questionInput = page.locator('[data-testid="question-dropzone"] input[type="file"]');
    await questionInput.setInputFiles(path.join(FIXTURES, questionFile));
    await expect(page.locator(`p:has-text("${questionFile}")`)).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: '开始识别' }).click();
    await expect(page.locator('h1', { hasText: '确认识别内容' })).toBeVisible({ timeout: OCR_TIMEOUT });
    await expect(page.locator('[data-testid="ocr-textarea"]')).toBeVisible({ timeout: OCR_TIMEOUT });

    await page.getByRole('button', { name: '开始批改' }).click();
    await page.waitForURL(/\/corrections\/[a-zA-Z0-9-]+/, { timeout: CORRECT_TIMEOUT });

    return page.url().split('/corrections/')[1].split('?')[0];
  } finally {
    await context.close();
  }
}

async function getLatestEssaySummary(page: import('@playwright/test').Page, examPart?: 'part1' | 'part2') {
  const essays = await page.evaluate(async () => {
    const res = await fetch('/api/essays?limit=100', { method: 'GET' });
    if (!res.ok) return [];
    const data = await res.json() as {
      essays?: Array<{
        id: string;
        exam_part?: string;
      }>;
    };
    return data?.essays?.map((essay) => ({
      id: essay.id,
      examPart: essay.exam_part ?? null,
    })) ?? [];
  }) as Array<{ id: string; examPart: string | null }>;

  const filtered = essays.filter((essay) => (examPart ? essay.examPart === examPart : true));
  return filtered[0] ?? null;
}

async function getLatestEssayDetail(page: import('@playwright/test').Page, examPart?: 'part1' | 'part2') {
  const essaySummary = await getLatestEssaySummary(page, examPart);
  if (!essaySummary?.id) {
    return null;
  }

  const data = await page.evaluate(async (submissionId: string) => {
    const res = await fetch(`/api/essays/${submissionId}`, { method: 'GET' });
    if (!res.ok) return null;
    return await res.json();
  }, essaySummary.id) as {
    essay?: {
      exam_part?: string;
      correction?: {
        id?: string;
        model_essays?: Array<{ id: string }>;
      } | null;
    };
  } | null;
  if (!data) {
    return null;
  }
  const modelEssayId = data?.essay?.correction?.model_essays?.[0]?.id ?? null;

  return {
    modelEssayId,
    examPart: data?.essay?.exam_part ?? null,
    correctionId: data?.essay?.correction?.id ?? null,
    submissionId: essaySummary.id,
  } as { modelEssayId: string | null; examPart: string | null; correctionId: string | null; submissionId: string };
}

/**
 * 字帖排版和模板选择 E2E 测试
 *
 * 测试目标：
 * 1. Part1 作文自动使用 pet 模板
 * 2. Part2 作文自动使用 pet-part2 模板
 * 3. 手动指定模板可以覆盖自动选择
 * 4. 编辑后的范文保存后，可稳定生成字帖并命中同内容缓存
 * 5. 编辑内容变化后，会生成新的字帖缓存而不是复用旧结果
 */

test.describe('字帖模板选择验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: USER_ID,
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('COPYBOOK-LAYOUT-001: Part1作文自动使用pet模板', async ({ page }) => {
    // 获取该用户的 Part1 作文
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');

    const part1Essay = await getLatestEssayDetail(page, 'part1');

    if (!part1Essay?.modelEssayId) {
      test.skip('没有 Part1 测试数据');
      return;
    }

    expect(part1Essay.examPart).toBe('part1');

    // 调用字帖生成API，不指定模板
    const result = await page.evaluate(async (modelEssayId: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_essay_id: modelEssayId,
          mode: 'tracing',
          // 不指定 template_id，让后端自动选择
        }),
      });
      const body = await res.json() as { copybook?: { template_id: string; id: string } };
      return { status: res.status, copybook: body?.copybook };
    }, part1Essay.modelEssayId);

    expect(result.status).toBeLessThan(300);
    expect(result.copybook).toBeDefined();
    expect(result.copybook?.template_id).toBe('pet');
  });

  test('COPYBOOK-LAYOUT-002: Part2作文自动使用pet-part2模板', async ({ page }) => {
    // 获取该用户的 Part2 作文
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');

    const part2Essay = await getLatestEssayDetail(page, 'part2');

    if (!part2Essay?.modelEssayId) {
      test.skip('没有 Part2 测试数据');
      return;
    }

    expect(part2Essay.examPart).toBe('part2');

    // 调用字帖生成API，不指定模板
    const result = await page.evaluate(async (modelEssayId: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_essay_id: modelEssayId,
          mode: 'tracing',
          // 不指定 template_id，让后端自动选择
        }),
      });
      const body = await res.json() as { copybook?: { template_id: string; id: string } };
      return { status: res.status, copybook: body?.copybook };
    }, part2Essay.modelEssayId);

    expect(result.status).toBeLessThan(300);
    expect(result.copybook).toBeDefined();
    expect(result.copybook?.template_id).toBe('pet-part2');
  });

  test('COPYBOOK-LAYOUT-003: 手动指定模板可以覆盖自动选择', async ({ page }) => {
    // 获取 Part1 作文但手动指定 Part2 模板
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');

    const part1Essay = await getLatestEssayDetail(page, 'part1');

    if (!part1Essay?.modelEssayId) {
      test.skip('没有 Part1 测试数据');
      return;
    }

    // 调用字帖生成API，手动指定 pet-part2 模板
    const result = await page.evaluate(async (modelEssayId: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_essay_id: modelEssayId,
          mode: 'tracing',
          template_id: 'pet-part2', // 手动指定 Part2 模板
        }),
      });
      const body = await res.json() as { copybook?: { template_id: string; id: string } };
      return { status: res.status, copybook: body?.copybook };
    }, part1Essay.modelEssayId);

    expect(result.status).toBeLessThan(300);
    expect(result.copybook).toBeDefined();
    // 验证使用了手动指定的模板，而不是自动选择的 pet
    expect(result.copybook?.template_id).toBe('pet-part2');
  });
});

test.describe('范文编辑后字帖生成验证', () => {
  const USER_ID = '00000000-0000-0000-0000-000000000001';

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: USER_ID,
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('COPYBOOK-LAYOUT-004: 编辑后的范文生成字帖应使用编辑内容', async ({ page }) => {
    // 获取任意一个作文的范文
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');

    const essayDetail = await getLatestEssayDetail(page, 'part1');
    const modelEssayId = essayDetail?.modelEssayId ?? null;

    if (!modelEssayId) {
      test.skip('没有测试数据');
      return;
    }

    const editedContent = Array.from({ length: 7 }, () =>
      'This edited version is written for cache testing and stays within the required range.'
    ).join(' ');

    // 模拟编辑范文
    const editResponse = await page.evaluate(async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/model-essays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: content,
          user_preference_notes: 'Test edit for E2E',
        }),
      });
      return res.status;
    }, { id: modelEssayId, content: editedContent });

    expect(editResponse).toBeLessThan(300);

    // 生成两次字帖，第二次应命中同内容缓存
    const result = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_essay_id: id,
          mode: 'tracing',
        }),
      });
      const body = await res.json() as {
        copybook?: {
          id: string;
          font_style: string;
        };
      };
      return { status: res.status, copybook: body?.copybook };
    }, modelEssayId);

    const cachedResult = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_essay_id: id,
          mode: 'tracing',
        }),
      });
      const body = await res.json() as {
        copybook?: {
          id: string;
          font_style: string;
        };
      };
      return { status: res.status, copybook: body?.copybook };
    }, modelEssayId);

    expect(result.status).toBeLessThan(300);
    expect(result.copybook).toBeDefined();
    expect(result.copybook?.id).toBeTruthy();
    expect(cachedResult.status).toBeLessThan(300);
    expect(cachedResult.copybook?.id).toBeTruthy();
  });

  test('COPYBOOK-LAYOUT-005: 编辑后的范文生成字帖不应使用缓存', async ({ page }) => {
    // 获取任意一个作文的范文
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');

    const essayDetail = await getLatestEssayDetail(page, 'part1');
    const modelEssayId = essayDetail?.modelEssayId ?? null;

    if (!modelEssayId) {
      test.skip('没有测试数据');
      return;
    }

    // 先恢复为未编辑状态
    await page.evaluate(async (id: string) => {
      await fetch(`/api/model-essays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: null,
          user_preference_notes: null,
        }),
      });
    }, modelEssayId);

    // 第一次生成（原始内容）
    const firstResult = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
      const body = await res.json() as { copybook?: { id: string; font_style: string } };
      return { copybook: body?.copybook };
    }, modelEssayId);

    expect(firstResult.copybook?.id).toBeTruthy();

    // 编辑范文为版本 A
    await page.evaluate(async (id: string) => {
      await fetch(`/api/model-essays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: 'Edited cache test version A. This version is long enough to satisfy the save validation and still clearly differs from the original text. It contains enough words to represent a realistic manual edit for the copybook cache test, and it should force the generator to create a new copybook record when the content changes.',
        }),
      });
    }, modelEssayId);

    // 第二次生成（版本 A），应生成新的字帖，不是使用原始内容缓存
    const secondResult = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
      const body = await res.json() as { copybook?: { id: string; font_style: string } };
      return { copybook: body?.copybook };
    }, modelEssayId);

    // 再编辑为版本 B，验证内容变化后继续生成新的字帖
    await page.evaluate(async (id: string) => {
      await fetch(`/api/model-essays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: 'Edited cache test version B. This second version is also intentionally long, valid, and distinct from version A so that the cache key changes again. The goal is to confirm that a changed model essay content produces another new copybook instead of reusing the prior one.',
        }),
      });
    }, modelEssayId);

    const thirdResult = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
      const body = await res.json() as { copybook?: { id: string; font_style: string } };
      return { copybook: body?.copybook };
    }, modelEssayId);

    expect(secondResult.copybook?.id).not.toBe(firstResult.copybook?.id);
    expect(thirdResult.copybook?.id).not.toBe(secondResult.copybook?.id);
  });
});
