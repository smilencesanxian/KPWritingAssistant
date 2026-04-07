import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * 字帖功能 E2E 测试
 *
 * 原则：E2E 测试必须验证真实业务结果，而不只是"API 不崩溃"。
 *
 * 覆盖：
 * 1. 未登录鉴权拦截（API 返回 401）
 * 2. 登录状态下字帖生成返回有效数据（真实业务断言）
 * 3. /copybook/[id] 页面路由保护
 */

// ─── 鉴权拦截（不需要登录，只验证 auth 逻辑正确） ──────────────────────────────

test.describe('字帖 API — 未登录鉴权拦截', () => {
  test('未认证时返回 401', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id' }),
      });
      return { status: res.status };
    });
    expect(response.status).toBe(401);
  });

  test('/copybook/[id] 未登录重定向到 /login', async ({ page }) => {
    await page.goto(`${BASE}/copybook/00000000-0000-0000-0000-000000000000`);
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 8000 });
  });
});

// ─── 字帖生成业务验证（需要已有真实 correction 数据） ───────────────────────────
//
// 这组测试依赖 full-flow-real.spec.ts 中 beforeAll 创建的 correction。
// 如果独立运行本文件，请先确保数据库中有对应测试用户的批改记录。
// 测试用 E2E bypass 用户：00000000-0000-0000-0000-000000000001（Part1 邮件）
//
// ⚠️ 设计原则：
//   - 必须使用真实 model_essay_id 调用字帖生成接口
//   - 必须断言返回的字帖数据包含有效字段（id、url 或 content）
//   - 不能只断言 status !== 500

test.describe('字帖生成 — 登录状态业务验证', () => {
  const USER_ID = '00000000-0000-0000-0000-000000000001';

  // 获取该用户最近一条批改的 model_essay_id
  async function getLatestModelEssayId(page: import('@playwright/test').Page): Promise<string | null> {
    const result = await page.evaluate(async () => {
      const res = await fetch('/api/essays?limit=1', { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json() as { essays?: Array<{ corrections?: Array<{ model_essays?: Array<{ id: string }> }> }> };
      return data?.essays?.[0]?.corrections?.[0]?.model_essays?.[0]?.id ?? null;
    });
    return result;
  }

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: USER_ID,
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('COPYBOOK-001: 历史列表页可访问，不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/history`);
    await page.waitForLoadState('networkidle');
    // 页面渲染成功（没有 Next.js 错误边界）
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('COPYBOOK-002: 如有 model_essay，字帖 API 返回有效数据（非 5xx）', async ({ page }) => {
    await page.goto(`${BASE}/history`);

    const modelEssayId = await getLatestModelEssayId(page);
    if (!modelEssayId) {
      test.skip(); // 无测试数据，跳过（不报失败）
      return;
    }

    const result = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
      const body = await res.json() as { copybook?: { id: string; url?: string } };
      return { status: res.status, hasCopybook: !!body?.copybook, copybookId: body?.copybook?.id };
    }, modelEssayId);

    // 关键业务断言：生成成功，返回有效字帖对象
    expect(result.status, '字帖生成应成功（2xx）').toBeLessThan(300);
    expect(result.hasCopybook, '返回体应包含 copybook 对象').toBe(true);
    expect(result.copybookId, '字帖应有有效 ID').toBeTruthy();
  });

  test('COPYBOOK-003: 相同参数二次请求使用缓存（响应时间 < 5s）', async ({ page }) => {
    await page.goto(`${BASE}/history`);

    const modelEssayId = await getLatestModelEssayId(page);
    if (!modelEssayId) {
      test.skip();
      return;
    }

    // 第一次调用（可能生成）
    await page.evaluate(async (id: string) => {
      await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
    }, modelEssayId);

    // 第二次调用应命中缓存，快速返回
    const start = Date.now();
    const result = await page.evaluate(async (id: string) => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: id, mode: 'tracing' }),
      });
      return res.status;
    }, modelEssayId);
    const elapsed = Date.now() - start;

    expect(result).toBeLessThan(300);
    expect(elapsed, '缓存命中应在 5 秒内返回').toBeLessThan(5000);
  });
});
