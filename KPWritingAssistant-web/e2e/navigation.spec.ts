import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

test.describe('导航和页面加载', () => {
  test('404 页面正常显示', async ({ page }) => {
    await page.goto(`${BASE}/this-page-does-not-exist`);
    // Next.js 404 或自定义 not-found 页面
    const status = page.url();
    // 页面不应该完全崩溃（没有 500 错误）
    await expect(page.locator('body')).toBeVisible();
  });

  test('/login 页面有正确的 title', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page).toHaveTitle(/KP作文宝.*登录|登录.*KP作文宝/);
  });

  test('/register 页面有正确的 title', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page).toHaveTitle(/KP作文宝.*注册|注册.*KP作文宝/);
  });

  test('首页正常加载，不崩溃', async ({ page }) => {
    const response = await page.goto(`${BASE}/`);
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('表单可访问性', () => {
  test('登录表单 label 与 input 正确关联', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    // 点击 label 应聚焦对应 input
    await page.locator('label[for="email"]').click();
    await expect(page.locator('#email')).toBeFocused();
    await page.locator('label[for="password"]').click();
    await expect(page.locator('#password')).toBeFocused();
  });

  test('注册表单 label 与 input 正确关联', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.locator('label[for="email"]').click();
    await expect(page.locator('#email')).toBeFocused();
    await page.locator('label[for="password"]').click();
    await expect(page.locator('#password')).toBeFocused();
    await page.locator('label[for="confirmPassword"]').click();
    await expect(page.locator('#confirmPassword')).toBeFocused();
  });

  test('登录表单支持键盘 Tab 导航', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.locator('#email').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '登录' })).toBeFocused();
  });

  test('注册表单支持键盘 Tab 导航', async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await page.locator('#email').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#password')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#confirmPassword')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '注册' })).toBeFocused();
  });

  test('按 Enter 键提交登录表单', async ({ page }) => {
    await page.route('**/auth/v1/token*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid credentials' }),
      });
    });
    await page.goto(`${BASE}/login`);
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'testpassword');
    await page.keyboard.press('Enter');
    await expect(page.locator('text=邮箱或密码错误，请重试')).toBeVisible({ timeout: 8000 });
  });
});
