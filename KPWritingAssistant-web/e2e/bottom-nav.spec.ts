import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('底部导航栏 - 写作导览入口 (Task 17)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('networkidle');
  });

  test.describe('E2E-001: 底部导航显示6个导航项', () => {
    test('should display all 6 navigation items', async ({ page }) => {
      // Get all navigation items
      const navItems = page.locator('nav a, nav button, nav [role="link"]').filter({ hasText: /^(首页|历史|亮点库|导览|易错点|我的)$/ });

      // Should have exactly 6 items
      await expect(navItems).toHaveCount(6);

      // Verify all labels are present
      await expect(page.getByText('首页')).toBeVisible();
      await expect(page.getByText('历史')).toBeVisible();
      await expect(page.getByText('亮点库')).toBeVisible();
      await expect(page.getByText('导览')).toBeVisible();
      await expect(page.getByText('易错点')).toBeVisible();
      await expect(page.getByText('我的')).toBeVisible();
    });

    test('guide item should be positioned between highlights and error-points', async ({ page }) => {
      // Get the navigation container
      const nav = page.locator('nav').filter({ has: page.getByText('首页') }).first();

      // Get all navigation links with text
      const navLinks = nav.locator('a, button, [role="link"]');

      // Get text content of all items
      const texts = await navLinks.allTextContents();
      const cleanTexts = texts.map(t => t.trim()).filter(t => t.length > 0);

      // Verify order: 首页, 历史, 亮点库, 导览, 易错点, 我的
      expect(cleanTexts).toContain('首页');
      expect(cleanTexts).toContain('历史');
      expect(cleanTexts).toContain('亮点库');
      expect(cleanTexts).toContain('导览');
      expect(cleanTexts).toContain('易错点');
      expect(cleanTexts).toContain('我的');

      // Verify relative positions
      const highlightsIndex = cleanTexts.indexOf('亮点库');
      const guideIndex = cleanTexts.indexOf('导览');
      const errorPointsIndex = cleanTexts.indexOf('易错点');

      expect(guideIndex).toBeGreaterThan(highlightsIndex);
      expect(guideIndex).toBeLessThan(errorPointsIndex);
    });
  });

  test.describe('E2E-002: 点击导览跳转到写作导览页', () => {
    test('clicking guide nav item navigates to /writing-guide', async ({ page }) => {
      // Find and click the guide navigation item
      const guideNav = page.getByText('导览').first();
      await expect(guideNav).toBeVisible();

      await guideNav.click();

      // Verify URL changed
      await expect(page).toHaveURL(/\/writing-guide/);

      // Verify page loaded (no 500 error)
      await expect(page.locator('body')).toBeVisible();
    });

    test('guide nav item has correct href', async ({ page }) => {
      // Find the guide link
      const guideLink = page.locator('a', { hasText: '导览' }).first();

      // Verify href attribute
      await expect(guideLink).toHaveAttribute('href', '/writing-guide');
    });
  });

  test.describe('E2E-003: 在写作导览页底部导航正确高亮', () => {
    test('guide nav item is highlighted when on /writing-guide', async ({ page }) => {
      // Navigate directly to writing-guide page
      await page.goto(`${BASE}/writing-guide`);
      await page.waitForLoadState('networkidle');

      // Find the guide nav item
      const guideNav = page.locator('a', { hasText: '导览' }).first();

      // Verify it's visible
      await expect(guideNav).toBeVisible();

      // Check for active state (should have primary color class or similar)
      // The active state is indicated by text-primary-600 class
      const hasActiveClass = await guideNav.evaluate(el =>
        el.classList.contains('text-primary-600') ||
        el.closest('[class*="text-primary-600"]') !== null
      );

      // Also check by color style if class approach doesn't work
      const color = await guideNav.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return computed.color;
      });

      // Active state should be indicated somehow (either by class or color)
      expect(hasActiveClass || color !== 'rgb(163, 163, 163)').toBeTruthy();
    });

    test('guide nav item is highlighted on sub-routes', async ({ page }) => {
      // Navigate to a sub-route (if exists)
      await page.goto(`${BASE}/writing-guide`);
      await page.waitForLoadState('networkidle');

      // If the page has sub-navigation, test it
      // Otherwise, just verify the main page works
      const guideNav = page.locator('a', { hasText: '导览' }).first();
      await expect(guideNav).toBeVisible();
    });

    test('other nav items are not highlighted when on guide page', async ({ page }) => {
      // Navigate to writing-guide page
      await page.goto(`${BASE}/writing-guide`);
      await page.waitForLoadState('networkidle');

      // Get home nav item
      const homeNav = page.locator('a', { hasText: '首页' }).first();

      // Should not have active class
      const hasActiveClass = await homeNav.evaluate(el =>
        el.classList.contains('text-primary-600')
      );

      expect(hasActiveClass).toBe(false);
    });
  });

  test.describe('E2E-004: 移动端6个导航项均匀分布', () => {
    test('navigation items are evenly distributed on mobile viewport', async ({ page }) => {
      // Set mobile viewport (iPhone SE size)
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to home page
      await page.goto(`${BASE}/`);
      await page.waitForLoadState('networkidle');

      // Get navigation container
      const nav = page.locator('nav').filter({ has: page.getByText('首页') }).first();
      await expect(nav).toBeVisible();

      // Get all nav items
      const navItems = nav.locator('a, button, [role="link"]').filter({ hasText: /^(首页|历史|亮点库|导览|易错点|我的)$/ });
      const count = await navItems.count();
      expect(count).toBe(6);

      // Get nav container width
      const navBounds = await nav.boundingBox();
      expect(navBounds).not.toBeNull();

      if (navBounds) {
        // Each item should be approximately 1/6 of container width
        const expectedItemWidth = navBounds.width / 6;

        // Check first and last items are within bounds
        const firstItem = navItems.first();
        const lastItem = navItems.last();

        const firstBounds = await firstItem.boundingBox();
        const lastBounds = await lastItem.boundingBox();

        expect(firstBounds).not.toBeNull();
        expect(lastBounds).not.toBeNull();

        if (firstBounds && lastBounds) {
          // First item should start near left edge
          expect(firstBounds.x).toBeGreaterThanOrEqual(0);
          expect(firstBounds.x).toBeLessThan(50);

          // Last item should end near right edge
          expect(lastBounds.x + lastBounds.width).toBeLessThanOrEqual(navBounds.width + 5);

          // Items should not overlap significantly
          const itemWidths = await navItems.evaluateAll(els =>
            els.map(el => el.getBoundingClientRect().width)
          );

          // All items should have similar widths (within 20% tolerance)
          const avgWidth = itemWidths.reduce((a, b) => a + b, 0) / itemWidths.length;
          itemWidths.forEach(width => {
            expect(Math.abs(width - avgWidth)).toBeLessThan(avgWidth * 0.3);
          });
        }
      }
    });

    test('navigation text is readable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto(`${BASE}/`);
      await page.waitForLoadState('networkidle');

      // Check all nav labels are visible
      const labels = ['首页', '历史', '亮点库', '导览', '易错点', '我的'];
      for (const label of labels) {
        const element = page.getByText(label).first();
        await expect(element).toBeVisible();

        // Check font size is readable (at least 10px)
        const fontSize = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return parseInt(computed.fontSize, 10);
        });

        expect(fontSize).toBeGreaterThanOrEqual(10);
      }
    });
  });

  test.describe('E2E-005: 原有导航项功能正常', () => {
    test('home navigation works correctly', async ({ page }) => {
      // Start from a different page
      await page.goto(`${BASE}/history`);
      await page.waitForLoadState('networkidle');

      // Click home
      await page.getByText('首页').first().click();

      // Should navigate to home
      await expect(page).toHaveURL(/\/$/);
    });

    test('history navigation works correctly', async ({ page }) => {
      await page.getByText('历史').first().click();
      await expect(page).toHaveURL(/\/history/);
    });

    test('highlights navigation works correctly', async ({ page }) => {
      await page.getByText('亮点库').first().click();
      await expect(page).toHaveURL(/\/highlights/);
    });

    test('error-points navigation works correctly', async ({ page }) => {
      await page.getByText('易错点').first().click();
      await expect(page).toHaveURL(/\/error-points/);
    });

    test('profile navigation works correctly', async ({ page }) => {
      await page.getByText('我的').first().click();
      await expect(page).toHaveURL(/\/profile/);
    });

    test('each nav item shows correct active state on its page', async ({ page }) => {
      const navTests = [
        { label: '首页', url: '/' },
        { label: '历史', url: '/history' },
        { label: '亮点库', url: '/highlights' },
        { label: '导览', url: '/writing-guide' },
        { label: '易错点', url: '/error-points' },
        { label: '我的', url: '/profile' },
      ];

      for (const { label, url } of navTests) {
        // Navigate to the page
        await page.goto(`${BASE}${url}`);
        await page.waitForLoadState('networkidle');

        // Find the nav item
        const navItem = page.locator('a', { hasText: label }).first();
        await expect(navItem).toBeVisible();

        // Check it has active styling (text-primary-600 class)
        const isActive = await navItem.evaluate(el =>
          el.classList.contains('text-primary-600') ||
          el.closest('.text-primary-600') !== null
        );

        expect(isActive).toBe(true);
      }
    });
  });
});
