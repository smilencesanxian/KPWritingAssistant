import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * E2E 测试：知识库页面 (KB-4)
 *
 * 验收标准：
 * 1. 页面标题为"写作知识库"，有三类 Tab（邮件/文章/故事）
 * 2. 每类 Tab 下按功能分类展示系统知识和用户收藏
 * 3. 系统条目可收藏，收藏后按钮变为已收藏状态
 * 4. 与亮点库重合的条目显示金色 🌟 标识
 * 5. 用户自定义条目可删除
 * 6. 支持手动添加自定义知识
 */

test.describe('知识库页面 /writing-guide', () => {
  // 所有测试使用 E2E auth bypass cookie
  test.beforeEach(async ({ page }) => {
    // E2E auth bypass: 设置 x-e2e-user-id cookie
    await page.context().addCookies([{
      name: 'x-e2e-user-id',
      value: 'e2e-test-user-id',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock API 数据
    await page.route('**/api/recommended-phrases?**', async (route) => {
      const url = route.request().url();
      const essayType = new URL(url).searchParams.get('essayType');

      // 根据 essayType 返回不同的 mock 数据
      const mockData = getMockKnowledgeBaseData(essayType || 'email');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    // Mock 收藏 API
    await page.route('**/api/recommended-phrases/*/collect', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'highlight-' + Date.now(),
          text: 'Collected phrase',
          source: 'system',
          created_at: new Date().toISOString(),
        }),
      });
    });

    // Mock 删除 API
    await page.route('**/api/highlights/*', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, body: '{}' });
      } else {
        await route.continue();
      }
    });

    // Mock 添加自定义知识 API
    await page.route('**/api/highlights', async (route) => {
      if (route.request().method() === 'POST') {
        const body = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'user-highlight-' + Date.now(),
            ...body,
            source: 'user',
            created_at: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  // E2E-001: 页面正常加载和标题显示
  test('E2E-001: 页面标题显示"写作知识库"，三类 Tab 可见', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);

    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 验证页面标题
    await expect(page.locator('h1')).toContainText('写作知识库');

    // 验证三类 Tab 可见
    await expect(page.getByRole('button', { name: /邮件|email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /文章|article/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /故事|story/i })).toBeVisible();
  });

  // E2E-002: Tab 切换功能
  test('E2E-002: Tab 切换 - 邮件、文章、故事正常切换', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 默认应该显示邮件类内容
    await expect(page.getByText('开篇引入')).toBeVisible();

    // 切换到文章 Tab
    const articleTab = page.getByRole('button', { name: /文章|article/i });
    await articleTab.click();
    await page.waitForTimeout(500);

    // 验证文章类内容显示
    await expect(page.getByText('标题设计')).toBeVisible();

    // 切换到故事 Tab
    const storyTab = page.getByRole('button', { name: /故事|story/i });
    await storyTab.click();
    await page.waitForTimeout(500);

    // 验证故事类内容显示
    await expect(page.getByText('情节发展')).toBeVisible();

    // 切回邮件 Tab
    const emailTab = page.getByRole('button', { name: /邮件|email/i });
    await emailTab.click();
    await page.waitForTimeout(500);

    // 验证回到邮件类内容
    await expect(page.getByText('开篇引入')).toBeVisible();
  });

  // E2E-003: 收藏系统条目
  test('E2E-003: 点击 + 收藏系统条目，按钮变为已收藏状态', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 找到未收藏的系统条目（显示 收藏 按钮的）
    const collectButton = page.locator('button[data-testid^="collect-button-"]').first();
    await expect(collectButton).toBeVisible();

    // 点击收藏
    await collectButton.click();

    // 等待 API 响应
    await page.waitForTimeout(500);

    // 验证按钮变为已收藏状态（显示 ✓ 或"已收藏"）
    const collectedButton = page.locator('button:has-text("已收藏")').first();
    await expect(collectedButton).toBeVisible();
  });

  // E2E-004: 金色标识显示
  test('E2E-004: 亮点库中已有的词句显示金色 🌟 标识', async ({ page }) => {
    // Mock 包含 is_in_highlights=true 的数据
    await page.route('**/api/recommended-phrases?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sections: [
            {
              category: 'opening',
              category_label: '开篇引入',
              items: [
                {
                  id: 'phrase-001',
                  text: "I'm writing to ask about...",
                  type: 'phrase',
                  level: 'basic',
                  source: 'system',
                  is_collected: false,
                  is_in_highlights: true, // 在亮点库中
                },
                {
                  id: 'phrase-002',
                  text: 'Looking forward to...',
                  type: 'phrase',
                  level: 'advanced',
                  source: 'system',
                  is_collected: false,
                  is_in_highlights: false, // 不在亮点库中
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 验证金色星星标识存在
    const starIcon = page.locator('[data-testid="star-icon"], .text-yellow-500, .text-amber-500').first();
    await expect(starIcon).toBeVisible();

    // 或者验证包含 🌟 的文本
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('🌟');
  });

  // E2E-005: 手风琴折叠/展开
  test('E2E-005: CategorySection 手风琴可以折叠和展开', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 找到第一个分类标题
    const categoryHeader = page.locator('button, [role="button"]').filter({ hasText: '开篇引入' }).first();
    await expect(categoryHeader).toBeVisible();

    // 获取分类下的内容
    const categoryContent = page.locator('[data-testid="category-content"], .category-content').first();

    // 点击折叠
    await categoryHeader.click();
    await page.waitForTimeout(300);

    // 验证内容隐藏（如果使用了 aria-expanded 属性）
    const isExpanded = await categoryHeader.getAttribute('aria-expanded');
    if (isExpanded !== null) {
      expect(isExpanded).toBe('false');
    }

    // 再次点击展开
    await categoryHeader.click();
    await page.waitForTimeout(300);

    // 验证内容显示
    const isExpandedAfter = await categoryHeader.getAttribute('aria-expanded');
    if (isExpandedAfter !== null) {
      expect(isExpandedAfter).toBe('true');
    }
  });

  // E2E-006: 添加自定义知识
  test('E2E-006: 点击 FAB 添加自定义知识，成功提交', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 点击 FAB 按钮
    const fabButton = page.locator('[data-testid="add-knowledge-fab"]').first();
    await fabButton.click();

    // 等待弹窗出现
    const modal = page.locator('[data-testid="add-knowledge-modal"]').first();
    await expect(modal).toBeVisible();

    // 输入知识内容
    const contentInput = modal.locator('textarea').first();
    await contentInput.fill('My custom knowledge phrase');

    // 点击提交
    const submitButton = modal.locator('button[type="submit"]').first();
    await submitButton.click();

    // 等待弹窗关闭
    await expect(modal).toBeHidden();

    // 验证成功提示出现（toast）
    await expect(page.getByText('添加成功')).toBeVisible();
  });

  // E2E-007: 删除自定义条目
  test('E2E-007: 用户自定义条目可以删除', async ({ page }) => {
    // Mock 包含用户自定义条目的数据
    await page.route('**/api/recommended-phrases?**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sections: [
            {
              category: 'user_custom',
              category_label: '我的收藏',
              items: [
                {
                  id: 'user-phrase-001',
                  text: 'User custom entry to delete',
                  type: 'phrase',
                  level: 'basic',
                  source: 'user', // 用户自定义
                  is_collected: false,
                  is_in_highlights: true,
                  highlight_id: 'hl-user-001',
                },
              ],
            },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 验证用户自定义条目存在
    await expect(page.getByText('User custom entry to delete')).toBeVisible();

    // 找到删除按钮（红色 ×）
    const deleteButton = page.locator('button[data-testid^="delete-button-"]').first();
    await expect(deleteButton).toBeVisible();

    // 点击删除
    await deleteButton.click();

    // 等待删除动画/请求完成
    await page.waitForTimeout(500);

    // 验证条目从列表移除
    await expect(page.getByText('User custom entry to delete')).toBeHidden();
  });

  // E2E-008: 完整用户旅程
  test('E2E-008: 完整用户旅程 - 切换Tab、收藏、添加、删除', async ({ page }) => {
    await page.goto(`${BASE}/writing-guide`);
    await page.waitForLoadState('networkidle');

    // 1. 切换到文章 Tab
    const articleTab = page.getByRole('button', { name: /文章/i });
    await articleTab.click();
    await page.waitForTimeout(500);
    await expect(page.getByText('标题设计')).toBeVisible();

    // 2. 收藏一个系统条目
    const collectButton = page.locator('button[data-testid^="collect-button-"]').first();
    if (await collectButton.isVisible().catch(() => false)) {
      await collectButton.click();
      await page.waitForTimeout(500);
    }

    // 3. 添加自定义条目
    const fabButton = page.locator('[data-testid="add-knowledge-fab"]').first();
    await fabButton.click();

    const modal = page.locator('[data-testid="add-knowledge-modal"]').first();
    await expect(modal).toBeVisible();

    const contentInput = modal.locator('textarea').first();
    await contentInput.fill('Journey test custom phrase');

    const submitButton = modal.locator('button[type="submit"]').first();
    await submitButton.click();

    await expect(modal).toBeHidden();

    // 验证成功提示出现
    await expect(page.getByText('添加成功')).toBeVisible();

    // 4. 验证页面状态正常 - 文章Tab仍然选中
    await expect(page.getByTestId('tab-article')).toBeVisible();
  });
});

// 辅助函数：生成 mock 数据
function getMockKnowledgeBaseData(essayType: string): { sections: { category: string; category_label: string; items: { id: string; text: string; type: string; level: string; source: string; is_collected: boolean; is_in_highlights: boolean }[] }[] } {
  const data: Record<string, { sections: { category: string; category_label: string; items: { id: string; text: string; type: string; level: string; source: string; is_collected: boolean; is_in_highlights: boolean }[] }[] }> = {
    email: {
      sections: [
        {
          category: 'opening',
          category_label: '开篇引入',
          items: [
            { id: 'email-001', text: "I'm writing to ask about...", type: 'phrase', level: 'basic', source: 'system', is_collected: false, is_in_highlights: false, highlight_id: null },
            { id: 'email-002', text: 'Thank you for your letter...', type: 'phrase', level: 'advanced', source: 'system', is_collected: false, is_in_highlights: false, highlight_id: null },
            { id: 'email-user-001', text: 'My custom email phrase', type: 'phrase', level: 'basic', source: 'user', is_collected: false, is_in_highlights: true, highlight_id: 'hl-email-001' },
          ],
        },
        {
          category: 'closing',
          category_label: '结尾升华',
          items: [
            { id: 'email-003', text: 'Looking forward to hearing from you.', type: 'sentence', level: 'basic', source: 'system', is_collected: false, is_in_highlights: false },
          ],
        },
      ],
    },
    article: {
      sections: [
        {
          category: 'title',
          category_label: '标题设计',
          items: [
            { id: 'article-001', text: 'The Importance of...', type: 'phrase', level: 'basic', source: 'system', is_collected: false, is_in_highlights: false },
          ],
        },
        {
          category: 'opening',
          category_label: '开篇引入',
          items: [
            { id: 'article-002', text: 'In recent years, ... has become...', type: 'sentence', level: 'advanced', source: 'system', is_collected: false, is_in_highlights: false },
          ],
        },
      ],
    },
    story: {
      sections: [
        {
          category: 'plot',
          category_label: '情节发展',
          items: [
            { id: 'story-001', text: 'Suddenly, I realized...', type: 'phrase', level: 'basic', source: 'system', is_collected: false, is_in_highlights: false },
          ],
        },
        {
          category: 'emotion',
          category_label: '情感表达',
          items: [
            { id: 'story-002', text: 'I felt a mix of excitement and nervousness.', type: 'sentence', level: 'advanced', source: 'system', is_collected: false, is_in_highlights: false },
          ],
        },
      ],
    },
  };

  return data[essayType] || data.email;
}
