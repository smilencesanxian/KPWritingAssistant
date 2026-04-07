import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * 字帖排版和模板选择 E2E 测试
 *
 * 测试目标：
 * 1. Part1 作文自动使用 pet 模板
 * 2. Part2 作文自动使用 pet-part2 模板
 * 3. 手动指定模板可以覆盖自动选择
 * 4. 编辑后的范文生成字帖时使用编辑内容
 * 5. 缓存键包含编辑状态，编辑后生成新的字帖
 */

test.describe('字帖模板选择验证', () => {
  const USER_ID = '00000000-0000-0000-0000-000000000001';

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

    const part1Essay = await page.evaluate(async () => {
      const res = await fetch('/api/essays?exam_part=part1&limit=1', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json() as {
        essays?: Array<{
          exam_part?: string;
          corrections?: Array<{
            model_essays?: Array<{ id: string }>;
          }>;
        }>;
      };
      const essay = data?.essays?.[0];
      return {
        modelEssayId: essay?.corrections?.[0]?.model_essays?.[0]?.id ?? null,
        examPart: essay?.exam_part,
      };
    });

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

    const part2Essay = await page.evaluate(async () => {
      const res = await fetch('/api/essays?exam_part=part2&limit=1', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json() as {
        essays?: Array<{
          exam_part?: string;
          corrections?: Array<{
            model_essays?: Array<{ id: string }>;
          }>;
        }>;
      };
      const essay = data?.essays?.[0];
      return {
        modelEssayId: essay?.corrections?.[0]?.model_essays?.[0]?.id ?? null,
        examPart: essay?.exam_part,
      };
    });

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

    const part1Essay = await page.evaluate(async () => {
      const res = await fetch('/api/essays?exam_part=part1&limit=1', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json() as {
        essays?: Array<{
          corrections?: Array<{
            model_essays?: Array<{ id: string }>;
          }>;
        }>;
      };
      return data?.essays?.[0]?.corrections?.[0]?.model_essays?.[0]?.id ?? null;
    });

    if (!part1Essay) {
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
    }, part1Essay);

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

    const modelEssayId = await page.evaluate(async () => {
      const res = await fetch('/api/essays?limit=1', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json() as {
        essays?: Array<{
          corrections?: Array<{
            model_essays?: Array<{ id: string }>;
          }>;
        }>;
      };
      return data?.essays?.[0]?.corrections?.[0]?.model_essays?.[0]?.id ?? null;
    });

    if (!modelEssayId) {
      test.skip('没有测试数据');
      return;
    }

    // 模拟编辑范文
    const editResponse = await page.evaluate(async (id: string) => {
      const res = await fetch(`/api/model-essays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: 'This is edited content for testing copybook generation.',
          user_preference_notes: 'Test edit for E2E',
        }),
      });
      return res.status;
    }, modelEssayId);

    expect(editResponse).toBeLessThan(300);

    // 生成字帖，验证使用编辑后的内容（通过检查缓存键包含 edited 标识）
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
          cache_key: string;
        };
      };
      return { status: res.status, copybook: body?.copybook };
    }, modelEssayId);

    expect(result.status).toBeLessThan(300);
    expect(result.copybook).toBeDefined();
    expect(result.copybook?.id).toBeTruthy();
    // 验证缓存键包含 edited 标识，证明使用了编辑后的内容
    expect(result.copybook?.cache_key).toContain('edited');
  });

  test('COPYBOOK-LAYOUT-005: 编辑后的范文生成字帖不应使用缓存', async ({ page }) => {
    // 获取任意一个作文的范文
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');

    const modelEssayId = await page.evaluate(async () => {
      const res = await fetch('/api/essays?limit=1', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json() as {
        essays?: Array<{
          corrections?: Array<{
            model_essays?: Array<{ id: string }>;
          }>;
        }>;
      };
      return data?.essays?.[0]?.corrections?.[0]?.model_essays?.[0]?.id ?? null;
    });

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
      const body = await res.json() as { copybook?: { id: string; cache_key: string } };
      return { copybook: body?.copybook };
    }, modelEssayId);

    expect(firstResult.copybook?.cache_key).toContain('original');

    // 编辑范文
    await page.evaluate(async (id: string) => {
      await fetch(`/api/model-essays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_edited_content: 'Edited content for cache test.',
        }),
      });
    }, modelEssayId);

    // 第二次生成（编辑内容），应生成新的字帖，不是使用缓存
    const secondResult = await page.evaluate(async (id: string) => {
      const start = Date.now();
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
      const elapsed = Date.now() - start;
      const body = await res.json() as { copybook?: { id: string; cache_key: string } };
      return { elapsed, copybook: body?.copybook };
    }, modelEssayId);

    // 验证编辑后的缓存键不同
    expect(secondResult.copybook?.cache_key).toContain('edited');
    expect(secondResult.copybook?.id).not.toBe(firstResult.copybook?.id);
  });
});
