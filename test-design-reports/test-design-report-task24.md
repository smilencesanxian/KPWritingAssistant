:
# Task 24 测试设计报告 - AI批改提示词输出格式结构化JSON

## 功能概述

将AI批改系统的输出格式从旧版平面结构升级为新版结构化JSON格式，涉及：
1. `src/config/prompts.json` - 更新correction systemPrompt
2. `src/types/ai.ts` - 更新CorrectionResult接口
3. `src/lib/ai/llm.ts` - 更新correctEssay函数解析逻辑

### 新旧格式对比

**旧格式（Current）:**
```typescript
interface CorrectionResult {
  scores: CorrectionScores;  // 平面分数
  overall_comment: string;
  improvement_suggestions: string;  // 纯文本
  error_annotations: ErrorAnnotation[];
  highlights: Highlight[];
  error_summary: ErrorSummaryItem[];
}
```

**新格式（Required）:**
```typescript
interface CorrectionResult {
  scoring_overview: {
    content: { score: number; comment: string; };
    communication: { score: number; comment: string; };
    organisation: { score: number; comment: string; };
    language: { score: number; comment: string; };
  };
  correction_steps: {
    step1: string;  // 内容审查
    step2: string;  // 交际效果
    step3: string;  // 组织结构
    step4: Array<{original: string; error_type: string; suggestion: string;}>;
    step5: string;  // 亮点分析
    step6: string;  // 总评
  };
  improvement_suggestions: Array<{icon: string; title: string; detail: string;}>;
  highlights: Array<{text: string; type: 'vocabulary'|'phrase'|'sentence'; reason: string;}>;
  model_essay: string;
}
```

---

## 测试分层策略

| 层次 | 数量 | 覆盖范围 |
|------|------|---------|
| **单元测试** | 15个 | TypeScript类型定义、JSON Schema验证、解析函数 |
| **集成测试** | 8个 | LLM响应解析、错误处理、数据转换 |
| **E2E测试** | 4个 | 完整批改流程（Part1/Part2）、UI展示验证 |

---

## 单元测试用例清单

### UT-001 ~ UT-004: 新类型定义验证 (src/types/ai.ts)

| 用例ID | 描述 | 测试内容 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| UT-001 | ScoringDimension类型验证 | 验证{score, comment}结构 | 类型检查通过 | 高 |
| UT-002 | CorrectionStep4Item类型验证 | 验证step4数组项结构 | original/error_type/suggestion必填 | 高 |
| UT-003 | ImprovementSuggestion类型验证 | 验证icon/title/detail结构 | 类型检查通过 | 高 |
| UT-004 | 新旧CorrectionResult兼容性 | 验证旧代码引用新类型的编译错误 | 类型系统正确识别不兼容字段 | 高 |

### UT-005 ~ UT-009: JSON Schema验证 (单元测试)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-005 | 完整有效的新格式JSON | 所有字段完整填充 | 验证通过 | 高 |
| UT-006 | 缺少scoring_overview | 省略顶层字段 | 验证失败，提示缺失字段 | 高 |
| UT-007 | step4数组项格式错误 | step4包含缺少original的对象 | 验证失败 | 高 |
| UT-008 | improvement_suggestions格式错误 | 缺少icon或title字段 | 验证失败 | 高 |
| UT-009 | 字段类型错误 | score为字符串而非数字 | 验证失败 | 高 |

### UT-010 ~ UT-012: 解析函数单元测试 (src/lib/ai/llm.ts)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-010 | 新格式JSON正确解析 | 完整新格式响应 | 返回正确结构的对象 | 高 |
| UT-011 | 旧格式JSON向后兼容 | 旧格式响应 | 抛出明确的格式错误 | 中 |
| UT-012 | 字段映射正确性 | 包含所有新字段的响应 | 每个字段值正确映射 | 高 |

### UT-013 ~ UT-015: Prompt模板验证

| 用例ID | 描述 | 测试内容 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| UT-013 | Part1 Prompt包含新JSON结构 | 检查prompts.json中correction.systemPrompt | 包含新格式JSON示例 | 高 |
| UT-014 | Part2 Prompt包含新JSON结构 | 检查part2ExtraGuidance | 包含新格式JSON示例 | 高 |
| UT-015 | Prompt中字段说明完整性 | 验证所有新字段有中文说明 | 每个字段有清晰说明 | 中 |

---

## 集成测试用例清单

### IT-001 ~ IT-004: LLM响应解析 (src/lib/ai/llm.ts)

| 用例ID | 描述 | 场景 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| IT-001 | 新格式响应成功解析 | Mock LLM返回完整新格式JSON | correctEssay返回正确结构 | 高 |
| IT-002 | 响应包含Markdown代码块 | LLM返回带```json的响应 | 正确提取并解析JSON | 高 |
| IT-003 | 响应包含额外文本 | JSON前后有解释文字 | 正确提取JSON部分 | 高 |
| IT-004 | 无效JSON响应 | LLM返回非JSON格式 | 抛出格式化错误，进入重试 | 高 |

### IT-005 ~ IT-008: 数据验证与错误处理

| 用例ID | 描述 | 场景 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| IT-005 | 缺少必需字段 | scoring_overview缺少language | 验证失败，抛出错误 | 高 |
| IT-006 | 字段类型不匹配 | score为"5"而非5 | 验证失败或自动转换 | 高 |
| IT-007 | step4数组为空 | 无语法错误时step4为[] | 正确处理空数组 | 中 |
| IT-008 | improvement_suggestions为空 | 无建议时为空数组 | 正确处理空数组 | 中 |

---

## E2E测试用例清单 (Playwright)

### E2E-001 ~ E2E-002: Part1 邮件作文批改流程

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-001 | Part1作文成功批改 | 1. 上传Part1作文图片<br>2. 等待批改完成<br>3. 查看批改结果页 | 显示新格式评分：4个维度分数+评语，6步批改详情，结构化建议 | 高 |
| E2E-002 | Part1批改结果UI展示 | 查看批改详情页 | scoring_overview正确显示4个维度；correction_steps分步展示；improvement_suggestions带图标显示 | 高 |

### E2E-003 ~ E2E-004: Part2 文章/故事批改流程

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|---------|---------|---------|--------|
| E2E-003 | Part2 Q1文章成功批改 | 1. 上传Part2文章<br>2. 等待批改<br>3. 查看结果 | 正确识别为Part2，显示新格式评分 | 高 |
| E2E-004 | Part2 Q2故事成功批改 | 1. 上传Part2故事<br>2. 等待批改<br>3. 查看结果 | 正确识别为Part2-Q2，显示新格式评分 | 高 |

---

## 边界情况与Edge Cases

### 数据边界

| 场景 | 描述 | 预期处理 |
|------|------|---------|
| 超长comment | scoring_overview.comment超过500字 | 正常存储，UI截断显示 |
| 特殊字符 | comment包含引号、换行符 | JSON正确转义，正常显示 |
| 空字符串 | step1~step6为"" | 允许空字符串，UI显示占位符 |
| 大量step4项 | step4数组超过50项 | 正常处理，UI分页或折叠 |
| Unicode emoji | improvement_suggestions.icon为emoji | 正确存储和显示 |

### LLM响应边界

| 场景 | 描述 | 预期处理 |
|------|------|---------|
| 部分字段缺失 | LLM返回缺少model_essay | 验证失败，重试或报错 |
| 字段名拼写错误 | organisation拼写为organization | 类型系统应识别（英式拼法） |
| 数组项格式不一致 | step4中部分项缺少字段 | 验证失败，过滤或报错 |
| 多余字段 | LLM返回未定义的字段 | 忽略多余字段 |
| 嵌套深度异常 | highlights.reason嵌套对象 | 验证失败 |

---

## 验证逻辑推荐

### 1. JSON Schema验证 (推荐添加)

```typescript
// src/lib/ai/validation.ts
export const correctionResultSchema = z.object({
  scoring_overview: z.object({
    content: z.object({ score: z.number().min(0).max(5), comment: z.string() }),
    communication: z.object({ score: z.number().min(0).max(5), comment: z.string() }),
    organisation: z.object({ score: z.number().min(0).max(5), comment: z.string() }),
    language: z.object({ score: z.number().min(0).max(5), comment: z.string() }),
  }),
  correction_steps: z.object({
    step1: z.string(),
    step2: z.string(),
    step3: z.string(),
    step4: z.array(z.object({
      original: z.string(),
      error_type: z.string(),
      suggestion: z.string(),
    })),
    step5: z.string(),
    step6: z.string(),
  }),
  improvement_suggestions: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    detail: z.string(),
  })),
  highlights: z.array(z.object({
    text: z.string(),
    type: z.enum(['vocabulary', 'phrase', 'sentence']),
    reason: z.string(),
  })),
  model_essay: z.string(),
});
```

### 2. 响应解析增强

```typescript
// 在correctEssay函数中
function extractJsonFromResponse(content: string): string {
  // 处理Markdown代码块
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // 处理纯JSON
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return content;
}
```

### 3. 向后兼容策略

```typescript
// 如果需要支持旧格式数据
function migrateOldFormat(old: OldCorrectionResult): CorrectionResult {
  return {
    scoring_overview: {
      content: { score: old.scores.content, comment: '' },
      communication: { score: old.scores.communication, comment: '' },
      organisation: { score: old.scores.organization, comment: '' },
      language: { score: old.scores.language, comment: '' },
    },
    correction_steps: {
      step1: '', step2: '', step3: '', step4: [], step5: '', step6: old.overall_comment,
    },
    improvement_suggestions: [], // 从old.improvement_suggestions解析
    highlights: old.highlights,
    model_essay: '',
  };
}
```

---

## 测试文件创建计划

### 1. 单元测试文件

**文件路径**: `KPWritingAssistant-web/src/types/ai.test.ts`
- UT-001 ~ UT-004: 类型定义验证
- 使用TypeScript编译时类型检查

**文件路径**: `KPWritingAssistant-web/src/lib/ai/validation.test.ts` (新建)
- UT-005 ~ UT-009: JSON Schema验证
- 使用zod或手动验证函数

**文件路径**: `KPWritingAssistant-web/src/lib/ai/llm.test.ts` (新建)
- UT-010 ~ UT-012: 解析函数测试
- Mock OpenAI客户端

**文件路径**: `KPWritingAssistant-web/src/lib/ai/prompts.test.ts` (新建)
- UT-013 ~ UT-015: Prompt内容验证

### 2. 集成测试文件

**文件路径**: `KPWritingAssistant-web/src/lib/ai/correction.integration.test.ts` (新建)
- IT-001 ~ IT-008: 完整批改流程集成测试

### 3. E2E测试文件

**文件路径**: `KPWritingAssistant-web/e2e/correction-new-format.spec.ts` (新建)
- E2E-001 ~ E2E-004: 端到端批改流程

---

## 给主Agent的建议

### 可测试性建议

1. **添加data-testid属性**: 批改结果页的各个部分需要data-testid以便E2E测试定位
   - `data-testid="scoring-overview"`
   - `data-testid="correction-steps"`
   - `data-testid="improvement-suggestions"`

2. **导出验证函数**: 将JSON验证逻辑导出为独立函数，便于单元测试

3. **Prompt版本管理**: 考虑在prompts.json中添加version字段，便于追踪格式变更

4. **类型守卫函数**: 添加isNewCorrectionResult类型守卫，用于运行时格式检测

### 实现顺序建议

1. 先更新`src/types/ai.ts`中的类型定义（UT-001~004）
2. 更新`src/config/prompts.json`中的prompt（UT-013~015）
3. 更新`src/lib/ai/llm.ts`中的解析逻辑（UT-010~012, IT-001~008）
4. 最后更新UI组件展示新格式数据（E2E-001~004）

### 风险提示

1. **破坏性变更**: 新格式与旧格式不兼容，需要确保所有历史数据已迁移或前端能兼容显示
2. **LLM响应不稳定**: 需要充分的重试机制和错误处理
3. **字段命名**: 注意英式拼写`organisation` vs 美式`organization`，确保前后端一致

---

## 测试执行命令

```bash
# 单元测试
npm test -- src/types/ai.test.ts
npm test -- src/lib/ai/validation.test.ts
npm test -- src/lib/ai/llm.test.ts
npm test -- src/lib/ai/prompts.test.ts

# 集成测试
npm test -- src/lib/ai/correction.integration.test.ts

# E2E测试
npx playwright test e2e/correction-new-format.spec.ts

# 全部测试
npm test && npx playwright test
```

---

## 总结

本次测试设计覆盖：
- **15个单元测试**: 类型定义、JSON验证、解析逻辑
- **8个集成测试**: LLM响应处理、数据验证、错误处理
- **4个E2E测试**: 完整用户流程、UI展示验证

**关键验证点**:
1. 新JSON结构的完整性和正确性
2. LLM响应的鲁棒解析（处理Markdown、额外文本等）
3. Part1和Part2两种题型的兼容性
4. 旧格式的向后兼容或迁移策略
5. UI正确展示新格式的所有字段
