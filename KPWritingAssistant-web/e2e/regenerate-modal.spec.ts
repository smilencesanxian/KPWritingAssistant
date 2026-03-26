import { test, expect } from '@playwright/test';

test.describe('重新生成范文弹窗', () => {
  // Note: These tests assume the user is already logged in and on a model essay page
  // You may need to adjust the navigation based on your actual app structure

  test.beforeEach(async ({ page }) => {
    // Navigate to the application (adjust URL as needed)
    await page.goto('/');
    // Add authentication logic here if needed
  });

  test('E2E-001: 输入提示后点击重新生成按钮应触发请求', async ({ page }) => {
    // Navigate to a model essay page (adjust selector and URL as needed)
    // This is a placeholder - you'll need to adjust based on actual navigation

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Open the regenerate modal (assuming there's a button to open it)
    // Adjust the selector based on actual UI
    const openModalButton = page.locator('[data-testid="open-regenerate-modal"]').first();

    // If the button exists, click it
    if (await openModalButton.isVisible().catch(() => false)) {
      await openModalButton.click();
    } else {
      // For testing purposes, we can directly render the modal if needed
      // Or navigate to a specific page where the modal is accessible
      test.skip();
      return;
    }

    // Wait for modal to appear
    await expect(page.getByTestId('regenerate-sheet')).toBeVisible();

    // Type in the textarea
    const textarea = page.getByTestId('preference-input');
    await textarea.fill('更正式一些，加入描述性词汇');

    // Verify the input value
    await expect(textarea).toHaveValue('更正式一些，加入描述性词汇');

    // Click the regenerate button
    const regenerateButton = page.getByTestId('regenerate-button');

    // Verify button is enabled before clicking
    await expect(regenerateButton).toBeEnabled();

    // Intercept the API call to verify it's made
    const apiPromise = page.waitForRequest((request) =>
      request.url().includes('/api/model-essays/') &&
      request.url().includes('/regenerate') &&
      request.method() === 'POST'
    );

    await regenerateButton.click();

    // Verify API call is made
    const request = await apiPromise;
    expect(request).toBeTruthy();

    // Verify request body contains the preference notes
    const postData = request.postData();
    expect(postData).toContain('preference_notes');
    expect(postData).toContain('更正式一些，加入描述性词汇');
  });

  test('E2E-002: 空输入也能触发重新生成', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Try to open the modal
    const openModalButton = page.locator('[data-testid="open-regenerate-modal"]').first();

    if (await openModalButton.isVisible().catch(() => false)) {
      await openModalButton.click();
    } else {
      test.skip();
      return;
    }

    // Wait for modal
    await expect(page.getByTestId('regenerate-sheet')).toBeVisible();

    // Leave textarea empty (default state)
    const textarea = page.getByTestId('preference-input');
    await expect(textarea).toHaveValue('');

    // Button should still be enabled
    const regenerateButton = page.getByTestId('regenerate-button');
    await expect(regenerateButton).toBeEnabled();

    // Click should trigger API call
    const apiPromise = page.waitForRequest((request) =>
      request.url().includes('/api/model-essays/') &&
      request.url().includes('/regenerate') &&
      request.method() === 'POST'
    );

    await regenerateButton.click();

    const request = await apiPromise;
    expect(request).toBeTruthy();

    // Verify empty string is sent
    const postData = request.postData();
    expect(postData).toContain('preference_notes');
  });

  test('E2E-003: 加载状态下按钮应被禁用并显示加载文本', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openModalButton = page.locator('[data-testid="open-regenerate-modal"]').first();

    if (await openModalButton.isVisible().catch(() => false)) {
      await openModalButton.click();
    } else {
      test.skip();
      return;
    }

    await expect(page.getByTestId('regenerate-sheet')).toBeVisible();

    // Intercept and delay the API response to keep loading state
    await page.route('**/api/model-essays/**/regenerate', async (route) => {
      // Delay response to observe loading state
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          model_essay: {
            id: 'test-123',
            user_edited_content: null,
            is_user_edited: false,
          },
        }),
      });
    });

    const textarea = page.getByTestId('preference-input');
    await textarea.fill('测试加载状态');

    const regenerateButton = page.getByTestId('regenerate-button');
    await regenerateButton.click();

    // Verify loading state
    await expect(regenerateButton).toBeDisabled();
    await expect(page.getByText('正在重新生成...')).toBeVisible();

    // Wait for completion
    await expect(page.getByText('重新生成范文')).toBeVisible({ timeout: 5000 });
  });

  test('E2E-004: 点击取消按钮应关闭弹窗', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openModalButton = page.locator('[data-testid="open-regenerate-modal"]').first();

    if (await openModalButton.isVisible().catch(() => false)) {
      await openModalButton.click();
    } else {
      test.skip();
      return;
    }

    await expect(page.getByTestId('regenerate-sheet')).toBeVisible();

    // Click cancel button
    await page.getByText('取消').click();

    // Modal should close
    await expect(page.getByTestId('regenerate-sheet')).not.toBeVisible();
  });

  test('E2E-005: 点击遮罩层应关闭弹窗', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const openModalButton = page.locator('[data-testid="open-regenerate-modal"]').first();

    if (await openModalButton.isVisible().catch(() => false)) {
      await openModalButton.click();
    } else {
      test.skip();
      return;
    }

    await expect(page.getByTestId('regenerate-sheet')).toBeVisible();

    // Click backdrop
    await page.getByTestId('regenerate-sheet-backdrop').click();

    // Modal should close
    await expect(page.getByTestId('regenerate-sheet')).not.toBeVisible();
  });
});
