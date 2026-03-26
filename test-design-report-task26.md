# 测试设计报告 - Task 26: F2-Step4 批改结果页面重写

## 功能概述

重写批改结果页面 (`src/app/corrections/[id]/page.tsx`)，将原有的简单展示改为4大块结构化展示：

1. **评分总览 (Score Overview)** - 4维度表格展示，包含维度名称、分数/5、评语，底部显示总分/20
2. **批改详情 (Correction Details)** - 手风琴式可折叠面板，6个步骤各为独立面板，Step 4显示表格[原文|问题类型|建议]
3. **改进建议 (Improvement Suggestions)** - 每行左侧emoji图标，右侧加粗标题+详情
4. **范文示例 (Model Essay)** - 复用现有 ModelEssayView 组件

**关键要求**：
- 移动端响应式设计
- 向后兼容（处理 null 新字段）
- 构建和 Lint 必须通过
- Playwright 验证页面渲染

---

## 测试分层策略

| 层次 | 数量 | 覆盖范围 |
|------|------|---------|
| **单元测试** | 4个 | 组件渲染逻辑、数据格式化、条件渲染 |
| **集成测试** | 2个 | 页面与DB数据交互、API数据流 |
| **E2E测试** | 12个 | 页面完整渲染、用户交互、响应式布局、向后兼容 |

---

## 测试用例清单

### 单元测试 (Jest + React Testing Library)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-001 | 评分总览组件渲染 | scoring_comments 完整数据 | 4维度表格正确渲染，总分显示/20 | 高 |
| UT-002 | 批改详情手风琴交互 | correction_steps 6步骤数据 | 6个面板可点击展开/折叠，Step4显示表格 | 高 |
| UT-003 | 改进建议列表渲染 | structured_suggestions 数组 | 每行显示emoji+加粗标题+详情 | 高 |
| UT-004 | 向后兼容：旧数据展示 | 新字段为null，旧字段有值 | 页面不崩溃，显示旧格式数据 | 高 |

### 集成测试

| 用例ID | 描述 | 请求/输入 | 预期响应/结果 | 优先级 |
|--------|------|-----------|--------------|--------|
| IT-001 | 页面获取批改数据 | 访问 /corrections/[id] | 正确从DB获取correction记录及关联数据 | 高 |
| IT-002 | 新字段数据格式验证 | 包含scoring_comments等 | 数据正确解析并传递给组件 | 高 |

### E2E测试 (Playwright)

#### 基础渲染测试

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-001 | 完整新数据页面渲染 | 1. 登录<br>2. 访问有完整新数据的批改页面 | 4大块全部正确显示，无错误 | 高 |
| E2E-002 | 评分总览块显示验证 | 查看评分总览区域 | 显示4维度表格（内容/沟通/组织/语言），每行有分数和评语，底部总分/20 | 高 |
| E2E-003 | 批改详情手风琴功能 | 1. 查看批改详情块<br>2. 点击各步骤面板 | 6个步骤面板可展开/折叠，Step4显示原文-问题-建议表格 | 高 |
| E2E-004 | 改进建议列表显示 | 查看改进建议块 | 每行左侧emoji，右侧加粗标题+详情文本 | 高 |
| E2E-005 | 范文示例块显示 | 查看范文示例块 | ModelEssayView组件正确渲染，包含编辑/重新生成按钮 | 高 |

#### 向后兼容测试

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-006 | 旧数据页面渲染（新字段null） | 访问旧批改记录（scoring_comments等为空） | 页面正常渲染，不显示新块或显示降级内容，无报错 | 高 |
| E2E-007 | 部分新数据渲染 | 部分新字段有值，部分为null | 有值的字段正常显示，null字段不显示或显示占位符 | 高 |
| E2E-008 | 批改详情块隐藏（correction_steps为null） | 访问correction_steps为null的记录 | 批改详情块完全隐藏，其他块正常显示 | 高 |
| E2E-009 | 改进建议降级显示（structured_suggestions为null） | 访问structured_suggestions为null但有improvement_suggestions的记录 | 显示旧格式改进建议（whitespace-pre-line） | 高 |

#### 响应式测试

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-010 | 移动端布局适配 | 1. 使用移动端视口(375x667)<br>2. 访问批改页面 | 4大块垂直排列，表格横向可滚动，手风琴正常点击 | 高 |
| E2E-011 | 平板布局适配 | 使用平板视口(768x1024) | 布局合理，内容可读，无横向溢出 | 中 |

#### 边界条件测试

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-012 | 超长内容显示 | 访问包含超长评语/建议的批改记录 | 内容正确换行，不破坏布局，可滚动查看 | 中 |
| E2E-013 | 特殊字符处理 | 数据包含emoji、HTML标签、换行符 | 特殊字符正确渲染，不导致XSS或显示异常 | 中 |
| E2E-014 | 空数组处理 | structured_suggestions为空数组 | 改进建议块显示"暂无建议"或隐藏 | 中 |

#### 错误处理测试

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-015 | 无效批改ID | 访问不存在的 /corrections/invalid-id | 显示404页面 | 高 |
| E2E-016 | 未登录访问 | 未登录访问 /corrections/[id] | 重定向到登录页 | 高 |
| E2E-017 | 访问他人批改记录 | 登录用户A访问用户B的批改记录 | 显示404或无权限提示 | 高 |

---

## 边界条件检查清单

### 数据边界
- [ ] scoring_comments 各维度分数为0
- [ ] scoring_comments 各维度分数为5（满分）
- [ ] total_score 为0或20（边界值）
- [ ] correction_steps.step4 数组为空
- [ ] correction_steps.step4 数组包含大量条目（>20）
- [ ] structured_suggestions 数组为空
- [ ] structured_suggestions 包含大量条目（>10）
- [ ] 所有文本字段超长（>1000字符）
- [ ] 所有文本字段为null或空字符串

### 兼容性边界
- [ ] 旧数据：所有新字段为null
- [ ] 混合数据：部分新字段有值，部分为null
- [ ] 空对象：新字段为{}而非null
- [ ] 字段类型错误：数字字段传入字符串

### UI边界
- [ ] 移动端小屏幕（320px宽度）
- [ ] 大屏桌面（1920px宽度）
- [ ] 系统字体大小放大（无障碍）
- [ ] 深色模式（如支持）

---

## 已创建的测试文件

### E2E测试文件
- **路径**: `KPWritingAssistant-web/e2e/correction-result.spec.ts`
- **类型**: Playwright E2E测试
- **用例数**: 17个
- **覆盖**: 完整新数据渲染、向后兼容、响应式、边界条件、错误处理

### 单元测试文件
- **路径**: `KPWritingAssistant-web/src/app/corrections/[id]/page.test.tsx`
- **类型**: Jest + React Testing Library
- **用例数**: 4个
- **覆盖**: 组件渲染、数据格式化、条件渲染

---

## E2E环境说明

**Playwright配置**:
- Base URL: http://localhost:3001
- 浏览器: Chromium
- 视口: 默认 1280x720，响应式测试会切换

**测试依赖**:
1. 本地开发服务器运行在 localhost:3001
2. 需要有效的测试用户账号（用于登录测试）
3. 数据库中需要有测试数据：
   - 包含完整新字段的批改记录
   - 旧格式批改记录（新字段为null）
   - 部分字段有值的混合记录

**测试数据准备建议**:
```typescript
// 完整新数据
const fullDataCorrection = {
  scoring_comments: {
    content: { score: 4, comment: "内容充实，观点清晰" },
    communication: { score: 3, comment: "沟通效果良好" },
    organisation: { score: 4, comment: "结构清晰" },
    language: { score: 3, comment: "语法有小错误" }
  },
  correction_steps: {
    step1: "任务回应分析...",
    step2: "内容分析...",
    step3: "组织分析...",
    step4: [
      { original: "I go to school", error_type: "时态错误", suggestion: "I went to school" }
    ],
    step5: "改进建议...",
    step6: "总结..."
  },
  structured_suggestions: [
    { icon: "✍️", title: "注意时态", detail: "过去事件使用过去时" },
    { icon: "📝", title: "丰富词汇", detail: "使用更多连接词" }
  ]
};

// 旧数据
const legacyCorrection = {
  scoring_comments: null,
  correction_steps: null,
  structured_suggestions: null,
  improvement_suggestions: "1. 注意时态\n2. 丰富词汇"
};
```

---

## 给主Agent的建议

### 可测试性建议
1. **添加data-testid属性**：为4大块添加标识，便于E2E测试定位
   ```tsx
   <section data-testid="score-overview">...</section>
   <section data-testid="correction-details">...</section>
   <section data-testid="improvement-suggestions">...</section>
   <section data-testid="model-essay">...</section>
   ```

2. **手风琴面板添加状态标识**：
   ```tsx
   <div data-testid="step-panel-1" data-expanded="true">...</div>
   ```

3. **评分表格行标识**：
   ```tsx
   <tr data-testid="dimension-content">...</tr>
   <tr data-testid="dimension-communication">...</tr>
   ```

### 实现注意事项
1. **向后兼容处理**：使用可选链和空值合并
   ```tsx
   {correction.scoring_comments?.content?.score ?? '--'}
   ```

2. **条件渲染**：correction_steps为null时整个块隐藏
   ```tsx
   {correction.correction_steps && (
     <section>...</section>
   )}
   ```

3. **改进建议降级**：
   ```tsx
   {correction.structured_suggestions ? (
     <StructuredSuggestions data={correction.structured_suggestions} />
   ) : correction.improvement_suggestions ? (
     <pre className="whitespace-pre-line">{correction.improvement_suggestions}</pre>
   ) : null}
   ```

### 测试执行顺序建议
1. 先运行单元测试验证组件逻辑
2. 再运行E2E测试验证完整页面
3. 特别注意向后兼容测试用例（E2E-006至E2E-009）
4. 响应式测试需要在不同视口下执行

---

## 测试执行检查清单

开发完成后，请确认以下测试通过：

- [ ] `npm run lint` 无错误
- [ ] `npm run build` 构建成功
- [ ] 单元测试全部通过
- [ ] E2E测试全部通过
- [ ] 手动在浏览器验证页面渲染
- [ ] 手动验证移动端布局
