# 测试设计报告 - Task KB-4: 重写写作导览页面为知识库页面

## 功能概述

完全重写 `/writing-guide` 页面为知识库页面，实现三类 Tab（邮件/文章/故事）切换，每类下按功能分类展示系统知识和用户收藏。系统条目可收藏，与亮点库重合的用金色标识突出，用户自定义条目可删除，支持手动添加。

---

## 测试分层策略

| 层次 | 测试数量 | 覆盖范围 |
|------|---------|---------|
| 单元测试 | 4 个 | KnowledgeItem、CategorySection、AddKnowledgeModal 组件的纯逻辑 |
| 集成测试 | 3 个 | API 路由交互（收藏/删除/添加） |
| E2E 测试 | 12 个 | 完整用户流程（Tab切换、收藏、删除、添加、金色标识等） |

---

## 测试用例清单

### 单元测试 (UT)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-001 | KnowledgeItem 渲染 - 基础条目 | `{level: 'basic', is_collected: false, source: 'system'}` | 显示灰色 [基础] Badge，显示 + 收藏按钮 | 高 |
| UT-002 | KnowledgeItem 渲染 - 高级已收藏条目 | `{level: 'advanced', is_collected: true, is_in_highlights: true, source: 'system'}` | 显示橙色 [高级★] Badge，显示 🌟 金色图标，显示蓝色 ✓ 已收藏按钮 | 高 |
| UT-003 | KnowledgeItem 渲染 - 用户自定义条目 | `{source: 'user', is_collected: true}` | 显示红色 × 删除按钮，不显示收藏按钮 | 高 |
| UT-004 | CategorySection 手风琴切换 | 点击已展开的 section | section 折叠，内容隐藏 | 中 |

### 集成测试 (IT)

| 用例ID | 描述 | 请求 | 预期响应 | 优先级 |
|--------|------|------|---------|--------|
| IT-001 | 收藏系统知识条目 | `POST /api/recommended-phrases/phrase-001/collect` | 200 OK，返回创建的 highlight 数据，source='system' | 高 |
| IT-002 | 删除用户自定义条目 | `DELETE /api/highlights/highlight-001` | 200 OK，数据库中该条目被删除 | 高 |
| IT-003 | 添加自定义知识 | `POST /api/highlights` (含 knowledge_essay_type) | 200 OK，返回创建的 highlight，knowledge_essay_type 正确保存 | 高 |

### E2E 测试 (Playwright)

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-001 | 页面正常加载和标题显示 | 1. 登录后访问 /writing-guide | 页面标题显示"写作知识库"，三类 Tab 可见 | 高 |
| E2E-002 | Tab 切换功能 - 邮件→文章→故事 | 1. 点击"文章"Tab<br>2. 点击"故事"Tab<br>3. 点击"邮件"Tab | 每次切换后对应内容正确显示，URL 或状态更新 | 高 |
| E2E-003 | 收藏系统条目 | 1. 在邮件 Tab 找到未收藏的系统条目<br>2. 点击 + 按钮 | 按钮变为蓝色 ✓ 已收藏，亮点库页面同步出现该条目 | 高 |
| E2E-004 | 金色标识显示 - 亮点库重合 | 1. 确保某词句已在亮点库中<br>2. 访问知识库页面 | 该条目显示 🌟 金色图标 | 高 |
| E2E-005 | 手风琴折叠/展开 | 1. 点击某个 category 标题<br>2. 再次点击 | 第一次点击折叠隐藏内容，第二次点击展开显示内容 | 中 |
| E2E-006 | 添加自定义知识 | 1. 点击右下角 FAB (+)<br>2. 输入内容、选择类型<br>3. 点击提交 | 弹窗关闭，新条目出现在对应分类下 | 高 |
| E2E-007 | 删除自定义条目 | 1. 找到用户自定义条目<br>2. 点击红色 × 按钮<br>3. 确认删除 | 条目从列表移除，页面不刷新 | 高 |
| E2E-008 | 完整用户旅程 | 1. 切换到文章 Tab<br>2. 收藏一个条目<br>3. 添加自定义条目<br>4. 删除自定义条目 | 所有操作成功，页面状态正确 | 高 |

---

## 边界情况

### 数据边界
1. **空数据状态**: 当某 essay_type 下无任何知识条目时，显示空状态提示
2. **大量数据**: 当某分类下有超过 50 条数据时，滚动性能正常
3. **特殊字符**: 知识内容包含引号、HTML 标签等特殊字符时正确渲染

### 交互边界
1. **快速切换 Tab**: 快速连续点击不同 Tab，不应出现数据错乱或 loading 闪烁
2. **重复收藏**: 对同一系统条目快速点击多次 + 按钮，不应创建重复收藏
3. **网络异常**: 收藏/删除/添加时网络断开，显示错误提示，状态回滚

### 权限边界
1. **未登录访问**: 未登录用户访问 /writing-guide 应被重定向到登录页或显示登录提示
2. **删除他人条目**: 尝试删除其他用户的自定义条目应返回 403

---

## 已创建的测试文件

### 新建文件
- `/KPWritingAssistant-web/e2e/knowledge-base.spec.ts`（E2E 测试，8 个用例）

### 更新文件
- `/KPWritingAssistant-web/e2e/writing-guide.spec.ts`（更新为适配新页面，4 个用例）

---

## E2E 环境说明

- **Playwright 配置**: 已配置，使用端口 3001
- **测试依赖**: 需要本地服务运行在 localhost:3001
- **认证**: 使用 E2E bypass cookie (`x-e2e-user-id`) 绕过登录
- **Mock 策略**: API 路由使用 `page.route()` 进行 mock

---

## 给主 Agent 的建议

### 可测试性建议
1. **data-testid 属性**: 请为以下元素添加 `data-testid`：
   - Tab 按钮: `data-testid="tab-email"`, `data-testid="tab-article"`, `data-testid="tab-story"`
   - 收藏按钮: `data-testid="collect-button-{id}"`
   - 删除按钮: `data-testid="delete-button-{id}"`
   - 手风琴标题: `data-testid="category-section-{category}"`
   - FAB 按钮: `data-testid="add-knowledge-fab"`
   - 弹窗: `data-testid="add-knowledge-modal"`

2. **API 响应格式**: 确保 `/api/recommended-phrases?essayType=xxx&grouped=true` 返回格式：
   ```json
   {
     "sections": [
       {
         "category": "opening",
         "category_label": "开篇引入",
         "items": [
           {
             "id": "phrase-001",
             "text": "I'm writing to ask about...",
             "type": "phrase",
             "level": "basic",
             "source": "system",
             "is_collected": false,
             "is_in_highlights": false
           }
         ]
       }
     ]
   }
   ```

3. **加载状态**: 数据加载时显示 loading spinner (class 包含 `animate-spin`)

### 实现顺序建议
1. 先实现 Server Component 页面框架和 Tab 切换
2. 再实现 CategorySection 和 KnowledgeItem 组件
3. 最后实现 AddKnowledgeModal 和 API 集成
4. 每完成一个子功能即可运行对应 E2E 测试验证

---

## 测试执行命令

```bash
# 运行所有 E2E 测试
npx playwright test e2e/knowledge-base.spec.ts

# 运行特定测试
npx playwright test e2e/knowledge-base.spec.ts --grep "E2E-001"

# 运行更新后的 writing-guide 测试
npx playwright test e2e/writing-guide.spec.ts

# 带 UI 模式调试
npx playwright test e2e/knowledge-base.spec.ts --ui

# 生成 HTML 报告
npx playwright test e2e/knowledge-base.spec.ts --reporter=html
```

---

*报告生成时间: 2026-03-27*
*任务: KB-4 - 重写写作导览页面为知识库页面*
