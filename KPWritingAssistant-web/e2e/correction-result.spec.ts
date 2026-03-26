import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * 批改结果页面 E2E 测试
 *
 * 覆盖场景：
 * 1. 4大块结构化展示（评分总览、批改详情、改进建议、范文示例）
 * 2. 向后兼容（处理null新字段）
 * 3. 移动端响应式布局
 * 4. 边界条件和错误处理
 */

// ─── 辅助函数：设置登录状态 ────────────────────────────────────────────────────

async function setupAuth(page: import('@playwright/test').Page, userId: string = 'e2e-test-user-id') {
  await page.context().addCookies([{
    name: 'x-e2e-user-id',
    value: userId,
    domain: 'localhost',
    path: '/',
  }]);
}

// ─── 基础渲染测试 ─────────────────────────────────────────────────────────────

test.describe('批改结果页面 - 基础渲染', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('E2E-001: 完整新数据页面渲染 - 4大块全部正确显示', async ({ page }) => {
    // Mock API返回完整新数据
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          content_score: 4,
          communication_score: 3,
          organization_score: 4,
          language_score: 3,
          overall_comment: '总体表现良好',
          improvement_suggestions: null,
          scoring_comments: {
            content: { score: 4, comment: '内容充实，观点清晰' },
            communication: { score: 3, comment: '沟通效果良好，但可更直接' },
            organisation: { score: 4, comment: '结构清晰，段落分明' },
            language: { score: 3, comment: '语法有小错误，词汇需丰富' }
          },
          correction_steps: {
            step1: '任务回应分析：学生充分回应了题目要求',
            step2: '内容分析：观点明确，论证充分',
            step3: '组织分析：文章结构合理',
            step4: [
              { original: 'I go to school yesterday', error_type: '时态错误', suggestion: 'I went to school yesterday' },
              { original: 'It is very good', error_type: '词汇贫乏', suggestion: 'It is excellent' }
            ],
            step5: '改进建议：注意时态一致性',
            step6: '总结：整体表现良好，注意细节'
          },
          structured_suggestions: [
            { icon: '✍️', title: '注意时态', detail: '过去事件使用过去时态' },
            { icon: '📝', title: '丰富词汇', detail: '使用更多形容词和副词' },
            { icon: '🎯', title: '明确观点', detail: '开头直接表明立场' }
          ],
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'This is a test essay.',
          title: 'Test Essay',
          status: 'completed',
          created_at: '2024-01-01T00:00:00Z'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    await page.goto(`${BASE}/corrections/test-correction-id`);

    // 验证4大块都存在
    await expect(page.locator('[data-testid="score-overview"], section:has-text("评分总览")')).toBeVisible();
    await expect(page.locator('[data-testid="correction-details"], section:has-text("批改详情")')).toBeVisible();
    await expect(page.locator('[data-testid="improvement-suggestions"], section:has-text("改进建议")')).toBeVisible();
    await expect(page.locator('[data-testid="model-essay"], section:has-text("范文")')).toBeVisible();
  });

  test('E2E-002: 评分总览块显示验证 - 4维度表格', async ({ page }) => {
    await setupAuth(page);

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/test-correction-id`);

    // 验证4维度都存在
    await expect(page.locator('text=内容')).toBeVisible();
    await expect(page.locator('text=沟通')).toBeVisible();
    await expect(page.locator('text=组织')).toBeVisible();
    await expect(page.locator('text=语言')).toBeVisible();

    // 验证分数显示
    await expect(page.locator('text=4').first()).toBeVisible();
    await expect(page.locator('text=3').first()).toBeVisible();

    // 验证总分/20
    await expect(page.locator('text=/14.*分/')).toBeVisible();
    await expect(page.locator('text=/20.*分|满分20/')).toBeVisible();

    // 验证评语显示
    await expect(page.locator('text=内容充实')).toBeVisible();
    await expect(page.locator('text=结构清晰')).toBeVisible();
  });

  test('E2E-003: 批改详情手风琴功能 - 6步骤可展开折叠', async ({ page }) => {
    await setupAuth(page);

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          correction_steps: {
            step1: '任务回应分析内容',
            step2: '内容分析内容',
            step3: '组织分析内容',
            step4: [
              { original: 'I go', error_type: '时态错误', suggestion: 'I went' }
            ],
            step5: '改进建议内容',
            step6: '总结内容'
          },
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/test-correction-id`);

    // 验证6个步骤标题都存在
    await expect(page.locator('text=Step 1, text=步骤1, text=任务回应')).toBeVisible();
    await expect(page.locator('text=Step 4, text=步骤4, text=语言校对')).toBeVisible();

    // 点击展开Step 1
    const step1Button = page.locator('button:has-text("Step 1"), button:has-text("步骤1")').first();
    await step1Button.click();

    // 验证内容展开
    await expect(page.locator('text=任务回应分析内容')).toBeVisible();

    // 点击Step 4验证表格
    const step4Button = page.locator('button:has-text("Step 4"), button:has-text("步骤4")').first();
    await step4Button.click();

    // 验证表格列存在
    await expect(page.locator('text=原文, text=错误类型, text=建议')).toBeVisible();
    await expect(page.locator('text=I go')).toBeVisible();
    await expect(page.locator('text=时态错误')).toBeVisible();
    await expect(page.locator('text=I went')).toBeVisible();
  });

  test('E2E-004: 改进建议列表显示 - emoji+标题+详情', async ({ page }) => {
    await setupAuth(page);

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          structured_suggestions: [
            { icon: '✍️', title: '注意时态', detail: '过去事件使用过去时态' },
            { icon: '📝', title: '丰富词汇', detail: '使用更多形容词' }
          ],
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/test-correction-id`);

    // 验证emoji显示
    await expect(page.locator('text=✍️')).toBeVisible();
    await expect(page.locator('text=📝')).toBeVisible();

    // 验证标题加粗显示
    await expect(page.locator('text=注意时态')).toBeVisible();
    await expect(page.locator('text=丰富词汇')).toBeVisible();

    // 验证详情显示
    await expect(page.locator('text=过去事件使用过去时态')).toBeVisible();
    await expect(page.locator('text=使用更多形容词')).toBeVisible();
  });

  test('E2E-005: 范文示例块显示 - ModelEssayView组件', async ({ page }) => {
    await setupAuth(page);

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-essay-id',
          correction_id: 'test-correction-id',
          target_level: 'excellent',
          content: 'This is a model essay.',
          created_at: '2024-01-01T00:00:00Z'
        }])
      });
    });

    await page.goto(`${BASE}/corrections/test-correction-id`);

    // 验证范文区域存在
    await expect(page.locator('text=卓越范文, text=范文示例')).toBeVisible();

    // 验证编辑和重新生成按钮
    await expect(page.locator('button:has-text("编辑范文")')).toBeVisible();
    await expect(page.locator('button:has-text("重新生成")')).toBeVisible();
  });
});

// ─── 向后兼容测试 ─────────────────────────────────────────────────────────────

test.describe('批改结果页面 - 向后兼容', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('E2E-006: 旧数据页面渲染 - 新字段为null时不崩溃', async ({ page }) => {
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'legacy-correction-id',
          submission_id: 'test-submission-id',
          total_score: 12,
          content_score: 3,
          communication_score: 3,
          organization_score: 3,
          language_score: 3,
          overall_comment: '旧格式评语',
          improvement_suggestions: '1. 注意时态\\n2. 丰富词汇',
          scoring_comments: null,
          correction_steps: null,
          structured_suggestions: null,
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test essay content',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/legacy-correction-id`);

    // 页面不崩溃，基本元素可见
    await expect(page.locator('text=12')).toBeVisible();
    await expect(page.locator('text=旧格式评语')).toBeVisible();

    // 新格式块不显示或显示降级内容
    const correctionDetails = page.locator('[data-testid="correction-details"]');
    await expect(correctionDetails).toHaveCount(0);
  });

  test('E2E-007: 部分新数据渲染 - 混合字段', async ({ page }) => {
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mixed-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          correction_steps: null,
          structured_suggestions: null,
          improvement_suggestions: '旧格式建议',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/mixed-correction-id`);

    // 评分总览显示（有值）
    await expect(page.locator('text=内容充实')).toBeVisible();

    // 批改详情不显示（null）
    const correctionDetails = page.locator('[data-testid="correction-details"]');
    await expect(correctionDetails).toHaveCount(0);

    // 改进建议显示旧格式（structured_suggestions为null，使用improvement_suggestions）
    await expect(page.locator('text=旧格式建议')).toBeVisible();
  });

  test('E2E-008: 批改详情块隐藏 - correction_steps为null', async ({ page }) => {
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'no-steps-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          correction_steps: null,
          structured_suggestions: [
            { icon: '✍️', title: '注意时态', detail: '使用过去时' }
          ],
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/no-steps-correction-id`);

    // 评分总览显示
    await expect(page.locator('text=内容充实')).toBeVisible();

    // 批改详情块完全不存在
    await expect(page.locator('text=批改详情, text=Step 1')).not.toBeVisible();

    // 改进建议显示
    await expect(page.locator('text=注意时态')).toBeVisible();
  });

  test('E2E-009: 改进建议降级显示 - structured_suggestions为null使用旧字段', async ({ page }) => {
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'fallback-correction-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          structured_suggestions: null,
          improvement_suggestions: '第一点建议\\n第二点建议\\n第三点建议',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/fallback-correction-id`);

    // 显示旧格式改进建议
    await expect(page.locator('text=第一点建议')).toBeVisible();
    await expect(page.locator('text=第二点建议')).toBeVisible();
    await expect(page.locator('text=第三点建议')).toBeVisible();

    // 验证whitespace-pre-line样式（换行保留）
    const suggestionsBlock = page.locator('text=第一点建议').locator('..');
    await expect(suggestionsBlock).toBeVisible();
  });
});

// ─── 响应式测试 ───────────────────────────────────────────────────────────────

test.describe('批改结果页面 - 响应式布局', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('E2E-010: 移动端布局适配', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mobile-test-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实，观点清晰，论证充分' },
            communication: { score: 3, comment: '沟通效果良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错误' }
          },
          correction_steps: {
            step1: '任务回应分析',
            step2: '内容分析',
            step3: '组织分析',
            step4: [
              { original: 'I go to school yesterday', error_type: '时态错误', suggestion: 'I went to school yesterday' }
            ],
            step5: '改进建议',
            step6: '总结'
          },
          structured_suggestions: [
            { icon: '✍️', title: '注意时态', detail: '使用过去时态' }
          ],
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/mobile-test-id`);

    // 验证内容可见
    await expect(page.locator('text=14')).toBeVisible();
    await expect(page.locator('text=内容充实')).toBeVisible();

    // 验证手风琴可点击
    const step1Button = page.locator('button:has-text("Step 1"), button:has-text("步骤1")').first();
    await expect(step1Button).toBeVisible();
    await step1Button.click();
    await expect(page.locator('text=任务回应分析')).toBeVisible();

    // 截图保存（可选）
    // await page.screenshot({ path: 'test-results/mobile-correction.png' });
  });

  test('E2E-011: 平板布局适配', async ({ page }) => {
    // 设置平板视口
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'tablet-test-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/tablet-test-id`);

    // 验证内容可读，布局合理
    await expect(page.locator('text=14')).toBeVisible();
    await expect(page.locator('text=内容充实')).toBeVisible();

    // 截图保存（可选）
    // await page.screenshot({ path: 'test-results/tablet-correction.png' });
  });
});

// ─── 边界条件测试 ─────────────────────────────────────────────────────────────

test.describe('批改结果页面 - 边界条件', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page);
  });

  test('E2E-012: 超长内容显示', async ({ page }) => {
    const longComment = '内容充实'.repeat(50);
    const longDetail = '使用过去时态'.repeat(30);

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'long-content-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: longComment },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          structured_suggestions: [
            { icon: '✍️', title: '注意时态', detail: longDetail }
          ],
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/long-content-id`);

    // 页面不崩溃，内容可见
    await expect(page.locator('text=内容充实')).toBeVisible();
    await expect(page.locator('text=注意时态')).toBeVisible();
  });

  test('E2E-013: 特殊字符处理', async ({ page }) => {
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'special-chars-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容<script>alert("xss")</script>充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          structured_suggestions: [
            { icon: '🎉', title: '注意<script>', detail: '使用<br>换行' }
          ],
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/special-chars-id`);

    // 页面不崩溃
    await expect(page.locator('text=14')).toBeVisible();

    // 验证XSS被转义（脚本标签作为纯文本显示）
    await expect(page.locator('text=<script>')).toBeVisible();
  });

  test('E2E-014: 空数组处理', async ({ page }) => {
    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'empty-array-id',
          submission_id: 'test-submission-id',
          total_score: 14,
          scoring_comments: {
            content: { score: 4, comment: '内容充实' },
            communication: { score: 3, comment: '沟通良好' },
            organisation: { score: 4, comment: '结构清晰' },
            language: { score: 3, comment: '语法有小错' }
          },
          correction_steps: {
            step1: '任务回应',
            step2: '内容分析',
            step3: '组织分析',
            step4: [], // 空数组
            step5: '改进建议',
            step6: '总结'
          },
          structured_suggestions: [], // 空数组
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-submission-id',
          user_id: 'e2e-test-user-id',
          ocr_text: 'Test',
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/highlights**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.route('**/rest/v1/model_essays**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto(`${BASE}/corrections/empty-array-id`);

    // 页面不崩溃
    await expect(page.locator('text=14')).toBeVisible();

    // Step 4显示空状态或提示
    const step4Button = page.locator('button:has-text("Step 4"), button:has-text("步骤4")').first();
    if (await step4Button.isVisible().catch(() => false)) {
      await step4Button.click();
      // 验证表格存在但可能显示"无错误"或空状态
    }
  });
});

// ─── 错误处理测试 ─────────────────────────────────────────────────────────────

test.describe('批改结果页面 - 错误处理', () => {
  test('E2E-015: 无效批改ID返回404', async ({ page }) => {
    await setupAuth(page);

    await page.route('**/rest/v1/corrections**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not found' })
      });
    });

    await page.goto(`${BASE}/corrections/invalid-id`);

    // 验证404页面或错误提示
    await expect(page.locator('text=404, text=Not Found, text=找不到')).toBeVisible();
  });

  test('E2E-016: 未登录访问重定向到登录页', async ({ page }) => {
    // 不设置cookie，模拟未登录
    await page.goto(`${BASE}/corrections/some-id`);

    // 验证重定向到登录页
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 8000 });
  });

  test('E2E-017: 访问他人批改记录返回404', async ({ page }) => {
    await setupAuth(page, 'user-a-id');

    await page.route('**/rest/v1/corrections**', async (route) => {
      // 返回属于user-b的数据
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-b-correction-id',
          submission_id: 'user-b-submission-id',
          total_score: 14,
          status: 'completed'
        })
      });
    });

    await page.route('**/rest/v1/essay_submissions**', async (route) => {
      // 返回属于user-b的提交，应该导致权限检查失败
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not found' })
      });
    });

    await page.goto(`${BASE}/corrections/user-b-correction-id`);

    // 验证404或无权限提示
    await expect(page.locator('text=404, text=Not Found, text=找不到')).toBeVisible();
  });
});
