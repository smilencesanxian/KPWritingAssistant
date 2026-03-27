import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('写作知识库页面 /writing-guide', () => {
  // 所有测试使用 E2E auth bypass cookie
  test.beforeEach(async ({ page }) => {
    // E2E auth bypass: 设置 x-e2e-user-id cookie
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: 'e2e-test-user-id',
      domain: 'localhost',
      path: '/',
    }]);
  });

  test('页面正常加载，不崩溃', async ({ page }) => {
    const response = await page.goto(`${BASE}/writing-guide`);
    // 页面应该返回 200 或 401（未登录），但不能是 500
    expect(response?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('未登录时显示错误提示', async ({ page }) => {
    // 清除 cookie 模拟未登录
    await page.context().clearCookies();
    await page.goto(`${BASE}/writing-guide`);
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    // 未登录时应该显示错误提示或登录按钮
    const bodyText = await page.locator('body').textContent();
    const hasLoginPrompt = bodyText?.includes('登录') || bodyText?.includes('请先登录') || bodyText?.includes('未登录');
    expect(hasLoginPrompt).toBe(true);
  });

  test('页面标题包含"写作知识库"', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');
    // 新页面标题应为"写作知识库"
    await expect(page.locator('h1')).toContainText(/写作知识库/);
  });

  test('页面包含三类 Tab', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 验证三类 Tab 存在（使用 data-testid）
    await expect(page.getByTestId('tab-email')).toBeVisible();
    await expect(page.getByTestId('tab-article')).toBeVisible();
    await expect(page.getByTestId('tab-story')).toBeVisible();

    // 验证 Tab 文本包含邮件、文章、故事
    const emailTab = page.getByTestId('tab-email');
    const articleTab = page.getByTestId('tab-article');
    const storyTab = page.getByTestId('tab-story');

    await expect(emailTab).toContainText(/邮件|email/i);
    await expect(articleTab).toContainText(/文章|article/i);
    await expect(storyTab).toContainText(/故事|story/i);
  });
});
