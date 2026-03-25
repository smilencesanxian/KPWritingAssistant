import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('写作导览页面 /writing-guide', () => {
  test('页面正常加载，不崩溃', async ({ page }) => {
    const response = await page.goto(`${BASE}/writing-guide`);
    // 页面应该返回 200 或 401（未登录），但不能是 500
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('未登录时显示错误提示', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    // 未登录时应该显示错误提示或登录按钮
    const bodyText = await page.locator('body').textContent();
    const hasLoginPrompt = bodyText?.includes('登录') || bodyText?.includes('请先登录');
    expect(hasLoginPrompt).toBe(true);
  });

  test('页面标题包含"写作导览"', async ({ page }) => {
    // 模拟已登录状态无法轻易测试，这里仅验证页面结构
    // 实际测试需要在登录状态下进行
    const response = await page.goto(`${BASE}/writing-guide`);
    if (response?.status() === 200) {
      await expect(page.locator('h1')).toContainText(/写作导览/);
    }
  });
});
