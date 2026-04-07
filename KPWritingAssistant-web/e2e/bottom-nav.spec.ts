import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * 底部导航栏 E2E 测试
 *
 * 当前导航结构（5项）：首页 / 历史 / 知识库 / 易错点 / 我的
 * "亮点库"已合并入"知识库"，不再作为独立导航项
 */

test.describe('底部导航栏', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
  });

  test('显示 5 个导航项（不含已合并的亮点库）', async ({ page }) => {
    const navItems = page.locator('nav a').filter({ hasText: /^(首页|历史|知识库|易错点|我的)$/ });
    await expect(navItems).toHaveCount(5);

    await expect(page.getByText('首页').first()).toBeVisible();
    await expect(page.getByText('历史').first()).toBeVisible();
    await expect(page.getByText('知识库').first()).toBeVisible();
    await expect(page.getByText('易错点').first()).toBeVisible();
    await expect(page.getByText('我的').first()).toBeVisible();
  });

  test('亮点库不作为独立导航项显示', async ({ page }) => {
    // 亮点库功能已合并入知识库，不应再有独立导航
    const highlightsNavLink = page.locator('nav a[href="/highlights"]');
    await expect(highlightsNavLink).toHaveCount(0);
  });

  test('知识库导航指向 /writing-guide', async ({ page }) => {
    const link = page.locator('nav a', { hasText: '知识库' }).first();
    await expect(link).toHaveAttribute('href', '/writing-guide');
  });

  test('导航项顺序：首页 → 历史 → 知识库 → 易错点 → 我的', async ({ page }) => {
    const nav = page.locator('nav').filter({ has: page.getByText('首页') }).first();
    const texts = await nav.locator('a').evaluateAll(
      els => els.map(el => el.textContent?.trim()).filter(Boolean)
    );
    expect(texts.indexOf('首页')).toBeLessThan(texts.indexOf('历史'));
    expect(texts.indexOf('历史')).toBeLessThan(texts.indexOf('知识库'));
    expect(texts.indexOf('知识库')).toBeLessThan(texts.indexOf('易错点'));
    expect(texts.indexOf('易错点')).toBeLessThan(texts.indexOf('我的'));
  });

  test('当前页面对应的导航项高亮显示', async ({ page }) => {
    const routes = [
      { label: '历史', url: '/history' },
      { label: '知识库', url: '/writing-guide' },
      { label: '易错点', url: '/error-points' },
    ];

    for (const { label, url } of routes) {
      await page.goto(`${BASE}${url}`);
      await page.waitForLoadState('domcontentloaded');

      const navItem = page.locator('nav a', { hasText: label }).first();
      await expect(navItem).toBeVisible();

      const isActive = await navItem.evaluate(el =>
        el.classList.contains('text-primary-600') ||
        !!el.closest('.text-primary-600')
      );
      expect(isActive, `${label} 导航项在 ${url} 页面应高亮`).toBe(true);
    }
  });

  test('移动端视口下 5 个导航项均匀分布可见', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav').filter({ has: page.getByText('首页') }).first();
    const navLinks = nav.locator('a').filter({ hasText: /^(首页|历史|知识库|易错点|我的)$/ });
    await expect(navLinks).toHaveCount(5);

    // 每个项文字可见
    for (const label of ['首页', '历史', '知识库', '易错点', '我的']) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });
});
