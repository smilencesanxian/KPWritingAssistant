import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

/**
 * 字帖功能 e2e 测试
 *
 * 覆盖场景：
 * 1. 原有回归：API 不因 PDFKit 路径问题返回 500
 * 2. 新增 template_id 参数：合法/非法值均不触发 500
 * 3. 新增 mode 参数：tracing / dictation / 非法值均不触发 500
 * 4. 字帖页面路由保护：未登录访问重定向到 /login
 * 5. 稳定性：并发多参数组合调用服务不崩溃
 */

// ─── 原有回归测试 ─────────────────────────────────────────────────────────────

test.describe('字帖生成 API /api/generate/copybook — 基础回归', () => {
  test('未认证时返回 401，而非 500 PDFKit 路径错误', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id' }),
      });
      return { status: res.status, body: await res.json() };
    });
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Unauthorized');
  });

  test('缺少 model_essay_id 时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });

  test('传入无效 JSON 时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });
});

// ─── 新增参数 template_id 测试 ────────────────────────────────────────────────

test.describe('字帖 API — template_id 参数处理', () => {
  test('传入 template_id: "pet"（合法）时 auth 先返回 401', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', template_id: 'pet' }),
      });
      return { status: res.status };
    });
    // auth 检查先于 template 验证，未认证统一返回 401
    expect(response.status).toBe(401);
  });

  test('传入 template_id: "unknown-format"（非法）时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', template_id: 'unknown-format' }),
      });
      return { status: res.status };
    });
    // 未认证时 auth check 先触发 → 401，不应崩溃为 500
    expect(response.status).not.toBe(500);
    expect(response.status).toBe(401);
  });

  test('传入 template_id 为空字符串时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', template_id: '' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });

  test('不传 template_id 时默认行为正常（不返回 500）', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });
});

// ─── 新增参数 mode 测试 ───────────────────────────────────────────────────────

test.describe('字帖 API — mode 参数处理', () => {
  test('传入 mode: "tracing"（临摹）时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', mode: 'tracing' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
    expect(response.status).toBe(401);
  });

  test('传入 mode: "dictation"（默写）时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', mode: 'dictation' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
    expect(response.status).toBe(401);
  });

  test('传入无效 mode 值时不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', mode: 'invalid-mode' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });

  test('不传 mode 时默认行为正常（不返回 500）', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });
});

// ─── template_id + mode 组合测试 ─────────────────────────────────────────────

test.describe('字帖 API — template_id 与 mode 组合', () => {
  test('pet + tracing 组合不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', template_id: 'pet', mode: 'tracing' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });

  test('pet + dictation 组合不返回 500', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/generate/copybook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_essay_id: 'test-id', template_id: 'pet', mode: 'dictation' }),
      });
      return { status: res.status };
    });
    expect(response.status).not.toBe(500);
  });

  test('并发多种参数组合时服务不崩溃', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const results = await page.evaluate(async () => {
      const cases = [
        { template_id: 'pet', mode: 'tracing' },
        { template_id: 'pet', mode: 'dictation' },
        { template_id: 'ket', mode: 'tracing' },      // 未来模板（未注册 → 401 before 400）
        { template_id: 'unknown', mode: 'invalid' },  // 双非法值
        { template_id: '', mode: '' },                // 双空值
        { mode: 'tracing' },                          // 缺 template_id → 默认 pet
        { template_id: 'pet' },                       // 缺 mode → 默认 tracing
      ];
      const responses = await Promise.all(
        cases.map(async (body) => {
          const res = await fetch('/api/generate/copybook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_essay_id: 'test-id', ...body }),
          });
          return res.status;
        })
      );
      return responses;
    });
    for (const status of results) {
      expect(status).not.toBe(500);
    }
  });
});

// ─── 字帖页面路由保护 ─────────────────────────────────────────────────────────

test.describe('字帖页面 /copybook/[id] — 路由保护', () => {
  test('未登录访问 /copybook/[uuid] 重定向到 /login', async ({ page }) => {
    await page.goto(`${BASE}/copybook/00000000-0000-0000-0000-000000000000`);
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 8000 });
  });

  test('未登录访问任意字帖 ID 均重定向到 /login', async ({ page }) => {
    await page.goto(`${BASE}/copybook/some-random-id`);
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 8000 });
  });

  test('/login 页面在重定向后正常渲染（不崩溃）', async ({ page }) => {
    await page.goto(`${BASE}/copybook/00000000-0000-0000-0000-000000000000`);
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 8000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });
});
