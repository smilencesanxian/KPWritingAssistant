## 测试设计报告 - Task 13: F3 亮点库页面增加推荐Tab

### 功能概述
在现有的亮点库页面（/highlights）添加一个新的"推荐"Tab，展示系统推荐的句式。用户可以将推荐的句式收藏到自己的亮点库中。已收藏的推荐句式会在用户的亮点列表中显示"推荐"标签。

---

### 测试分层策略

| 层次 | 数量 | 覆盖范围 |
|------|------|----------|
| 单元测试 | 18个 | RecommendedPhraseCard组件、工具函数、状态管理 |
| 集成测试 | 8个 | API调用、数据转换、收藏流程 |
| E2E测试 | 6个 | 用户完整操作流程、跨Tab状态验证 |

---

### 测试用例清单

#### 单元测试 (src/components/highlights/RecommendedPhraseCard.test.tsx)

| 用例ID | 描述 | 输入/条件 | 预期结果 | 优先级 |
|--------|------|-----------|----------|--------|
| UT-001 | 渲染基本卡片 | phrase={text, type, essay_type} | 显示文本、类型标签、作文类型标签 | 高 |
| UT-002 | 渲染词汇类型标签 | type='vocabulary' | 显示蓝色"词汇"标签 | 高 |
| UT-003 | 渲染短语类型标签 | type='phrase' | 显示紫色"短语"标签 | 高 |
| UT-004 | 渲染句子类型标签 | type='sentence' | 显示绿色"句子"标签 | 高 |
| UT-005 | 渲染邮件类作文标签 | essay_type='email' | 显示灰色"邮件"标签 | 中 |
| UT-006 | 渲染文章类作文标签 | essay_type='article' | 显示灰色"文章"标签 | 中 |
| UT-007 | 未收藏状态按钮 | isCollected=false | 显示空心+号图标 | 高 |
| UT-008 | 已收藏状态按钮 | isCollected=true | 显示实心勾选图标 | 高 |
| UT-009 | 点击收藏按钮 | onCollect回调 | 调用onCollect并传入phraseId | 高 |
| UT-010 | 加载状态显示 | isLoading=true | 按钮显示加载动画，禁用点击 | 高 |
| UT-011 | 展开使用示例 | 点击展开按钮 | 显示usage_example内容 | 中 |
| UT-012 | 收起使用示例 | 再次点击展开按钮 | 隐藏usage_example内容 | 中 |
| UT-013 | 无使用示例时不显示展开按钮 | usage_example=null | 不显示展开/收起按钮 | 中 |
| UT-014 | 长文本截断显示 | text长度>100字符 | 文本正确截断并显示省略号 | 低 |

#### 单元测试 (src/app/highlights/page.test.tsx - 新增)

| 用例ID | 描述 | 输入/条件 | 预期结果 | 优先级 |
|--------|------|-----------|----------|--------|
| UT-015 | 渲染推荐Tab | 组件加载 | 显示"推荐"Tab按钮 | 高 |
| UT-016 | 点击推荐Tab | 点击"推荐"按钮 | 切换到推荐视图，调用API | 高 |
| UT-017 | 推荐Tab选中样式 | activeTab='recommended' | Tab显示选中状态样式 | 中 |

#### 单元测试 (src/components/highlights/HighlightItem.test.tsx - 更新)

| 用例ID | 描述 | 输入/条件 | 预期结果 | 优先级 |
|--------|------|-----------|----------|--------|
| UT-018 | 显示推荐来源标签 | highlight.source='system' | 显示"推荐"徽章 | 高 |
| UT-019 | 不显示推荐标签 | highlight.source='user' | 不显示"推荐"徽章 | 高 |

#### 集成测试 (src/app/highlights/page.integration.test.tsx - 新增)

| 用例ID | 描述 | 请求/条件 | 预期响应/结果 | 优先级 |
|--------|------|-----------|---------------|--------|
| IT-001 | 获取推荐列表 | GET /api/recommended-phrases | 按essay_type分组显示 | 高 |
| IT-002 | 空推荐列表 | API返回空数组 | 显示"暂无推荐句式"空状态 | 高 |
| IT-003 | 收藏推荐句式 | POST /api/recommended-phrases/[id]/collect | 按钮变为已收藏状态 | 高 |
| IT-004 | 收藏后Toast提示 | 收藏成功 | 显示"已加入亮点库"Toast | 高 |
| IT-005 | 收藏API错误处理 | POST返回500 | 显示错误Toast，按钮恢复 | 高 |
| IT-006 | 已收藏状态持久化 | 刷新页面 | 已收藏的显示为已收藏状态 | 中 |
| IT-007 | 收藏的句式出现在用户列表 | 收藏后切换Tab | 在"全部"Tab看到收藏的句式 | 高 |
| IT-008 | 收藏的句式带推荐标签 | 收藏的句式 | 显示"推荐"徽章 | 高 |

#### E2E测试 (e2e/highlights-recommended-tab.spec.ts - 新增)

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| E2E-001 | 浏览推荐句式 | 1. 登录<br>2. 进入亮点库<br>3. 点击"推荐"Tab | 看到按分类分组的推荐句式 | 高 |
| E2E-002 | 收藏推荐句式 | 1. 在推荐Tab<br>2. 点击未收藏句式的+号<br>3. 等待加载完成 | 按钮变为勾选状态，显示Toast | 高 |
| E2E-003 | 收藏的句式出现在用户亮点 | 1. 收藏一个句式<br>2. 切换到"全部"Tab | 看到刚收藏的句式，带"推荐"标签 | 高 |
| E2E-004 | 展开使用示例 | 1. 在推荐Tab<br>2. 点击展开按钮 | 显示该句式的使用示例 | 中 |
| E2E-005 | 空状态显示 | 1. 进入推荐Tab<br>2. 确保没有推荐数据 | 显示"暂无推荐句式"提示 | 中 |
| E2E-006 | 收藏幂等性 | 1. 收藏一个句式<br>2. 再次点击收藏按钮 | 保持已收藏状态，不报错 | 中 |

---

### 边界条件和异常情况

| 场景 | 描述 | 预期处理 |
|------|------|----------|
| 网络异常 | API请求超时或失败 | 显示错误提示，允许重试 |
| 未登录 | 用户未登录时访问 | 重定向到登录页或显示登录提示 |
| 大量数据 | 推荐句式数量>100 | 支持虚拟滚动或分页加载 |
| 快速切换Tab | 用户快速切换Tab | 取消未完成的请求，避免竞态条件 |
| 重复点击收藏 | 用户快速多次点击收藏 | 防抖处理，防止重复请求 |
| 特殊字符 | 句式文本包含HTML特殊字符 | 正确转义显示，防止XSS |
| 超长文本 | 句式文本超过500字符 | 正确显示，不破坏布局 |

---

### 已创建的测试文件

| 文件路径 | 类型 | 用例数 |
|----------|------|--------|
| `src/components/highlights/RecommendedPhraseCard.test.tsx` | 单元测试 | 14 |
| `src/app/highlights/page.test.tsx` | 单元测试（补充） | 3 |
| `src/components/highlights/HighlightItem.test.tsx` | 单元测试（补充） | 2 |
| `src/app/highlights/page.integration.test.tsx` | 集成测试 | 8 |
| `e2e/highlights-recommended-tab.spec.ts` | E2E测试 | 6 |

---

### E2E环境说明

- 测试依赖本地服务运行在 http://localhost:3000
- 需要Playwright已安装
- 需要测试用户已登录（使用E2E测试cookie绕过）
- 数据库需要有预设的推荐句式数据

---

### 给主Agent的可测试性建议

1. **添加data-testid属性**：
   - `data-testid="recommended-tab"` - 推荐Tab按钮
   - `data-testid="recommended-card-{id}"` - 推荐卡片
   - `data-testid="collect-button-{id}"` - 收藏按钮
   - `data-testid="usage-example-{id}"` - 使用示例区域
   - `data-testid="empty-recommended"` - 空状态提示
   - `data-testid="system-badge"` - 推荐来源标签

2. **API响应格式**：
   ```typescript
   // GET /api/recommended-phrases
   {
     phrases: {
       email: [...],
       article: [...],
       general: [...]
     }
   }
   ```

3. **组件Props设计**：
   ```typescript
   interface RecommendedPhraseCardProps {
     phrase: RecommendedPhrase;
     isCollected: boolean;
     isLoading: boolean;
     onCollect: (id: string) => Promise<void>;
   }
   ```

4. **状态管理建议**：
   - 使用React state管理当前选中的Tab
   - 使用SWR或React Query缓存推荐数据
   - 收藏状态本地乐观更新，失败时回滚

---

### 测试执行命令

```bash
# 单元测试
npm test -- RecommendedPhraseCard.test.tsx
npm test -- highlights/page.test.tsx

# 集成测试
npm test -- highlights/page.integration.test.tsx

# E2E测试
npx playwright test e2e/highlights-recommended-tab.spec.ts

# 全部测试
npm test && npx playwright test
```
