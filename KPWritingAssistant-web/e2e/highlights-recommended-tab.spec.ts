import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3001';

/**
 * E2E 测试：亮点库"推荐"Tab 闪烁 Bug 修复验证
 *
 * 验收标准：
 * 1. 切换到推荐Tab后，数据加载完成后稳定显示，不再反复出现loading spinner
 * 2. 再次切换回推荐Tab时，直接显示缓存数据，无loading动画
 *
 * 根本原因（待修复）：useEffect 依赖数组含 recommendedPhrases state，
 * fetch 完成后 state 更新触发 effect 重跑，导致 loading 反复出现。
 * 修复方案：改用 useRef (hasFetchedRecommendedRef) 跟踪是否已发起过请求。
 */

test.describe('亮点库 - 推荐Tab稳定性（无闪烁）', () => {
  // 所有测试使用 route mock + E2E auth bypass cookie
  test.beforeEach(async ({ page }) => {
    // E2E auth bypass: 设置 x-e2e-user-id cookie，配合 E2E_BYPASS_AUTH=true 绕过中间件认证
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: 'e2e-test-user-id',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock /api/highlights 避免认证失败干扰
    await page.route('**/api/highlights**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ highlights: [], total: 0 }),
      });
    });

    // Mock /api/recommended-phrases 返回稳定数据
    await page.route('**/api/recommended-phrases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          phrases: {
            email: [
              {
                id: 'phrase-001',
                text: 'I am writing to inform you',
                type: 'phrase',
                essay_type: 'email',
                usage_example: 'I am writing to inform you of the recent changes.',
                is_active: true,
              },
            ],
            general: [
              {
                id: 'phrase-002',
                text: 'Furthermore',
                type: 'vocabulary',
                essay_type: null,
                usage_example: 'Furthermore, this approach is more efficient.',
                is_active: true,
              },
            ],
          },
        }),
      });
    });
  });

  test('E2E-001: 首次切换推荐Tab，loading结束后内容稳定显示不闪烁', async ({ page }) => {
    await page.goto(`${BASE}/highlights`);

    // 点击推荐Tab
    const recommendedTab = page.getByTestId('recommended-tab');
    await expect(recommendedTab).toBeVisible();
    await recommendedTab.click();

    // 等待loading消失（数据加载完成）
    const spinner = page.locator('.animate-spin').first();
    // 如果spinner出现，等待它消失
    await spinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {
      // spinner 可能从未出现（mock响应太快），这也是正常情况
    });

    // 验证推荐内容已稳定显示
    await expect(page.getByText('邮件类')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('I am writing to inform you')).toBeVisible();

    // 关键验证：等待额外时间，确认 loading spinner 不会再次出现（即无闪烁）
    // 如果 Bug 未修复，spinner 会在此期间重新出现
    await page.waitForTimeout(1500);
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });

  test('E2E-002: 推荐Tab内容加载后，API不被重复调用超过1次', async ({ page }) => {
    let recommendedApiCallCount = 0;

    // 覆盖 beforeEach 中的 route，加入计数器
    await page.route('**/api/recommended-phrases', async (route) => {
      recommendedApiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          phrases: {
            general: [
              {
                id: 'phrase-003',
                text: 'In conclusion',
                type: 'sentence',
                essay_type: null,
                usage_example: 'In conclusion, this essay has explored...',
                is_active: true,
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${BASE}/highlights`);
    await page.getByTestId('recommended-tab').click();

    // 等待内容渲染
    await expect(page.getByText('In conclusion')).toBeVisible({ timeout: 5000 });

    // 等待足够时间让可能的重复调用发生
    await page.waitForTimeout(1000);

    // 核心断言：API 只应被调用 1 次（修复后）
    // Bug 状态下会被调用 2+ 次（每次 state 更新触发重跑）
    expect(recommendedApiCallCount).toBe(1);
  });

  test('E2E-003: 切走再切回推荐Tab，不触发第二次API调用（使用缓存）', async ({ page }) => {
    let recommendedApiCallCount = 0;

    await page.route('**/api/recommended-phrases', async (route) => {
      recommendedApiCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          phrases: {
            email: [
              {
                id: 'phrase-004',
                text: 'Thank you for your letter',
                type: 'phrase',
                essay_type: 'email',
                usage_example: 'Thank you for your letter dated March.',
                is_active: true,
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${BASE}/highlights`);

    // 第一次切换到推荐Tab
    await page.getByTestId('recommended-tab').click();
    await expect(page.getByText('Thank you for your letter')).toBeVisible({ timeout: 5000 });

    // 切换到其他Tab（全部）
    await page.getByRole('button', { name: '全部' }).click();
    await expect(page.getByTestId('recommended-tab')).toBeVisible();

    // 再次切换回推荐Tab
    await page.getByTestId('recommended-tab').click();

    // 验证：切回后不应出现loading动画（使用缓存，不重新请求）
    await page.waitForTimeout(500);
    await expect(page.locator('.animate-spin')).toHaveCount(0);

    // 验证内容仍然显示
    await expect(page.getByText('Thank you for your letter')).toBeVisible();

    // 核心断言：API 总共只被调用 1 次（修复后应使用 ref 防止重复请求）
    expect(recommendedApiCallCount).toBe(1);
  });

  test('E2E-004: 推荐Tab加载期间loading spinner只出现一次', async ({ page }) => {
    // 使用慢响应模拟真实网络，便于观察spinner行为
    await page.route('**/api/recommended-phrases', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          phrases: {
            general: [
              {
                id: 'phrase-005',
                text: 'However',
                type: 'vocabulary',
                essay_type: null,
                usage_example: 'However, the results were unexpected.',
                is_active: true,
              },
            ],
          },
        }),
      });
    });

    await page.goto(`${BASE}/highlights`);

    let spinnerAppearCount = 0;
    let spinnerWasVisible = false;

    // 监听 spinner 的出现/消失
    page.on('domcontentloaded', () => {});

    await page.getByTestId('recommended-tab').click();

    // 轮询检测 spinner，记录其出现状态变化次数
    // 修复前：spinner会出现 -> 消失 -> 再出现（闪烁）
    // 修复后：spinner出现 -> 消失（仅一次）
    const startTime = Date.now();
    let lastSpinnerVisible = false;

    while (Date.now() - startTime < 3000) {
      const isVisible = await page.locator('.animate-spin').isVisible();
      if (isVisible && !lastSpinnerVisible) {
        spinnerAppearCount++;
      }
      lastSpinnerVisible = isVisible;
      if (isVisible) spinnerWasVisible = true;
      await page.waitForTimeout(100);
    }

    // loading spinner 出现次数不超过 1 次（无闪烁）
    expect(spinnerAppearCount).toBeLessThanOrEqual(1);
    // spinner 应该出现过（数据加载中）
    if (spinnerWasVisible) {
      // 最终 spinner 应消失（数据已加载完成）
      await expect(page.locator('.animate-spin')).toHaveCount(0);
    }

    // 最终内容正常显示
    await expect(page.getByText('However')).toBeVisible({ timeout: 3000 });
  });

  test('E2E-005: 推荐Tab数据为空时显示空状态提示，不循环loading', async ({ page }) => {
    // Mock 返回空数据
    await page.route('**/api/recommended-phrases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ phrases: {} }),
      });
    });

    await page.goto(`${BASE}/highlights`);
    await page.getByTestId('recommended-tab').click();

    // 等待空状态显示
    await expect(page.getByTestId('empty-recommended')).toBeVisible({ timeout: 5000 });

    // 确认无loading spinner残留
    await page.waitForTimeout(1000);
    await expect(page.locator('.animate-spin')).toHaveCount(0);
  });
});
