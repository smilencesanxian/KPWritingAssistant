import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ─── 注册页面测试 ─────────────────────────────────────────────────────────────

test.describe('注册页面 /register', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/register`);
  });

  test('页面正常加载，显示注册表单', async ({ page }) => {
    await expect(page).toHaveTitle(/注册/);
    await expect(page.locator('h1')).toContainText('创建账号');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
  });

  test('显示"去登录"链接，点击跳转到 /login', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: '去登录' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test('密码不一致时显示错误提示', async ({ page }) => {
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'different456');
    await page.getByRole('button', { name: '注册' }).click();
    await expect(page.locator('text=两次输入的密码不一致')).toBeVisible();
  });

  test('密码少于8位时显示错误提示', async ({ page }) => {
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'short');
    await page.fill('#confirmPassword', 'short');
    await page.getByRole('button', { name: '注册' }).click();
    await expect(page.locator('text=密码长度至少为8位')).toBeVisible();
  });

  test('邮箱格式无效时（浏览器原生校验）阻止提交', async ({ page }) => {
    await page.fill('#email', 'not-an-email');
    await page.fill('#password', 'password123');
    await page.fill('#confirmPassword', 'password123');
    await page.getByRole('button', { name: '注册' }).click();
    // 表单不应该提交，URL 保持不变
    await expect(page).toHaveURL(`${BASE}/register`);
  });

  test('所有字段为空时不提交（必填校验）', async ({ page }) => {
    await page.getByRole('button', { name: '注册' }).click();
    await expect(page).toHaveURL(`${BASE}/register`);
  });

  test('注册按钮在加载中时显示"注册中..."并禁用', async ({ page }) => {
    // 拦截 supabase 请求以模拟加载状态
    await page.route('**/auth/v1/signup', async (route) => {
      // 延迟响应以捕获 loading 状态
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.fill('#email', `test_${Date.now()}@example.com`);
    await page.fill('#password', 'testpassword123');
    await page.fill('#confirmPassword', 'testpassword123');

    const btn = page.getByRole('button', { name: /注册/ });
    await btn.click();

    // 在请求完成前，按钮应显示"注册中..."
    await expect(page.getByRole('button', { name: '注册中...' })).toBeVisible();
    await expect(page.getByRole('button', { name: '注册中...' })).toBeDisabled();
  });
});

// ─── 登录页面测试 ─────────────────────────────────────────────────────────────

test.describe('登录页面 /login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`);
  });

  test('页面正常加载，显示登录表单', async ({ page }) => {
    await expect(page).toHaveTitle(/登录/);
    await expect(page.locator('h1')).toContainText('KP作文宝');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('显示"立即注册"链接，点击跳转到 /register', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: '立即注册' });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(`${BASE}/register`);
  });

  test('错误凭证时显示错误提示', async ({ page }) => {
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.locator('text=邮箱或密码错误，请重试')).toBeVisible({ timeout: 10000 });
  });

  test('邮箱为空时不提交', async ({ page }) => {
    await page.fill('#password', 'somepassword');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test('登录按钮在提交后禁用，显示"登录中..."', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });

    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    const btn = page.getByRole('button', { name: '登录' });
    await btn.click();

    await expect(page.getByRole('button', { name: '登录中...' })).toBeVisible();
    await expect(page.getByRole('button', { name: '登录中...' })).toBeDisabled();
  });
});

// ─── 首页 / 落地页测试 ────────────────────────────────────────────────────────

test.describe('首页 /（未登录）', () => {
  test('显示落地页，有登录和注册按钮', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('h1')).toContainText('KP作文宝');
    await expect(page.getByRole('link', { name: '登录' })).toBeVisible();
    await expect(page.getByRole('link', { name: '注册' })).toBeVisible();
  });

  test('点击登录跳转到 /login', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('link', { name: '登录' }).click();
    await expect(page).toHaveURL(`${BASE}/login`);
  });

  test('点击注册跳转到 /register', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByRole('link', { name: '注册' }).click();
    await expect(page).toHaveURL(`${BASE}/register`);
  });
});

// ─── 路由保护测试 ─────────────────────────────────────────────────────────────

test.describe('路由保护（未登录访问受保护页面）', () => {
  const protectedRoutes = [
    '/upload',
    '/history',
    '/highlights',
    '/error-points',
    '/profile',
  ];

  for (const route of protectedRoutes) {
    test(`访问 ${route} 时重定向到 /login`, async ({ page }) => {
      await page.goto(`${BASE}${route}`);
      await expect(page).toHaveURL(`${BASE}/login`, { timeout: 8000 });
    });
  }
});

// ─── 注册后跳转测试 ────────────────────────────────────────────────────────────

test.describe('注册成功流程', () => {
  test('成功注册后跳转到 /login?registered=1 并显示提示', async ({ page }) => {
    // Set E2E bypass cookie so middleware doesn't block post-signup navigation
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: 'e2e-test-user-id',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock supabase signUp 成功 (use regex to ensure HTTPS URLs are matched)
    await page.route(/auth\/v1\/signup/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'mock-user-id', email: 'newuser@test.com' },
          session: null,
        }),
      });
    });

    await page.goto(`${BASE}/register`);
    await page.fill('#email', 'newuser@test.com');
    await page.fill('#password', 'validpassword123');
    await page.fill('#confirmPassword', 'validpassword123');
    await page.getByRole('button', { name: '注册' }).click();

    await expect(page).toHaveURL(`${BASE}/login?registered=1`, { timeout: 8000 });
  });
});

// ─── 登录页：注册成功提示 ─────────────────────────────────────────────────────

test.describe('登录页面注册成功提示', () => {
  test('带 registered=1 参数打开登录页时应显示注册成功提示', async ({ page }) => {
    await page.goto(`${BASE}/login?registered=1`);
    // 必须显示注册成功提示，告知用户需要检查邮箱
    const banner = page.locator('.bg-green-50');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText('注册成功');
    await expect(banner).toContainText('确认链接');
  });

  test('不带 registered 参数时，登录页不显示注册成功提示', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('text=注册成功')).not.toBeVisible();
  });

  test('注册成功提示样式为绿色（bg-green-50 边框）', async ({ page }) => {
    await page.goto(`${BASE}/login?registered=1`);
    const banner = page.locator('.bg-green-50');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toHaveClass(/border-green-200/);
  });
});
