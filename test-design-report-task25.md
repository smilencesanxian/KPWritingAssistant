## 测试设计报告 - Task 25: F2-Step3 批改API + DB访问层

### 功能概述
更新批改API和DB访问层，将AI返回的结构化JSON正确解析并写入corrections表新字段（scoring_comments/correction_steps/structured_suggestions），同时确保向后兼容旧数据。

### 测试分层策略
- **单元测试**：8个用例，覆盖DB访问层函数（createCorrection/getCorrectionById）和AI响应解析逻辑
- **集成测试**：4个用例，覆盖API端到端流程（correct API调用、数据持久化、响应格式）
- **E2E测试**：2个用例，覆盖用户完整批改流程和页面展示（本次不需要，因为主要是后端数据层修改）

### 测试用例清单

#### 单元测试 - DB访问层 (src/lib/db/corrections.test.ts)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-001 | createCorrection写入完整结构化数据 | CreateCorrectionInput包含scoring_comments/correction_steps/structured_suggestions | 数据成功写入DB，返回的Correction包含所有新字段 | 高 |
| UT-002 | createCorrection向后兼容（旧数据无新字段） | CreateCorrectionInput不含新字段 | 数据成功写入，新字段为null，不报错 | 高 |
| UT-003 | getCorrectionById查询包含新字段 | 存在新字段的correction记录ID | 返回的Correction包含scoring_comments/correction_steps/structured_suggestions | 高 |
| UT-004 | getCorrectionById向后兼容（旧记录新字段为null） | 旧correction记录ID（新字段为null） | 返回的Correction新字段为null，其他字段正常 | 高 |
| UT-005 | createCorrection处理部分新字段 | 只包含scoring_comments，不含其他新字段 | 成功写入，缺失字段为null | 中 |
| UT-006 | getCorrectionById处理不存在的记录 | 不存在的correction ID | 返回null，不抛出异常 | 中 |
| UT-007 | createCorrection处理DB错误 | 模拟DB连接失败 | 抛出包含错误信息的Error | 中 |
| UT-008 | getCorrectionBySubmissionId包含新字段 | submission ID关联的correction有新字段 | 返回结果包含新字段和exam_part | 中 |

#### 单元测试 - AI响应解析 (src/lib/ai/llm.test.ts)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-009 | extractScores从新格式解析 | scoring_overview包含4个维度分数 | 返回正确的CorrectionScores，total自动计算 | 高 |
| UT-010 | extractScores向后兼容旧格式 | 只有scores字段 | 直接返回scores对象 | 高 |
| UT-011 | validateCorrectionResult验证新格式 | 包含scoring_overview和improvement_suggestions数组 | 返回true | 高 |
| UT-012 | validateCorrectionResult验证旧格式 | 包含scores/error_annotations/error_summary | 返回true | 高 |
| UT-013 | validateCorrectionResult验证无效格式 | 缺少必要字段 | 返回false | 中 |

#### 集成测试 - API层 (src/app/api/correct/route.test.ts)

| 用例ID | 描述 | 请求 | 预期响应 | 优先级 |
|--------|------|------|---------|--------|
| IT-001 | POST /api/correct成功处理新格式AI响应 | 有效submission_id，AI返回新结构化格式 | 返回200，correction包含新字段，DB中scoring_comments等有值 | 高 |
| IT-002 | POST /api/correct向后兼容旧格式AI响应 | 有效submission_id，AI返回旧格式 | 返回200，correction正常，新字段可能为null | 高 |
| IT-003 | POST /api/correct数据持久化验证 | 有效submission_id | DB中corrections记录scoring_comments/correction_steps/structured_suggestions字段有数据 | 高 |
| IT-004 | POST /api/correct幂等性（已批改） | 已completed的submission_id | 返回现有correction，不重复调用AI | 中 |

#### 构建和代码规范测试

| 用例ID | 描述 | 命令 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| BT-001 | TypeScript编译无错误 | npm run build | 构建成功，无TypeScript错误 | 高 |
| BT-002 | ESLint检查无错误 | npm run lint | 无lint错误 | 高 |

### 已创建的测试文件
- `/mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant/KPWritingAssistant-web/src/lib/db/corrections.test.ts`（单元测试，8个用例）
- `/mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant/KPWritingAssistant-web/src/lib/ai/llm.test.ts`（单元测试，5个用例）
- `/mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant/KPWritingAssistant-web/src/app/api/correct/route.test.ts`（集成测试，4个用例）

### 测试数据示例

#### AI新格式响应示例
```json
{
  "scoring_overview": {
    "content": { "score": 4, "comment": "内容完整，覆盖了所有要点" },
    "communication": { "score": 4, "comment": "语气恰当，符合邮件格式" },
    "organisation": { "score": 3, "comment": "段落清晰，但过渡可改进" },
    "language": { "score": 4, "comment": "词汇丰富，语法基本正确" }
  },
  "correction_steps": {
    "step1": "这是一篇关于...的作文",
    "step2": "总体评价：内容完整...",
    "step3": "主要问题：1.语法错误 2.词汇使用",
    "step4": [
      { "original": "I very like", "error_type": "语法错误", "suggestion": "I like very much" }
    ],
    "step5": "修改后全文：...",
    "step6": "总体评语：作文整体不错..."
  },
  "improvement_suggestions": [
    { "icon": "📝", "title": "词汇丰富度", "detail": "建议多使用连接词" },
    { "icon": "🔤", "title": "语法准确性", "detail": "注意时态一致性" }
  ],
  "highlights": [],
  "model_essay": "范文内容..."
}
```

#### CreateCorrectionInput示例
```typescript
{
  content_score: 4,
  communication_score: 4,
  organization_score: 3,
  language_score: 4,
  total_score: 15,
  error_annotations: [],
  overall_comment: "总体评语",
  improvement_suggestions: "旧格式建议",
  // 新增字段
  scoring_comments: {
    content: { score: 4, comment: "内容完整" },
    communication: { score: 4, comment: "语气恰当" },
    organisation: { score: 3, comment: "过渡可改进" },
    language: { score: 4, comment: "词汇丰富" }
  },
  correction_steps: {
    step1: "...",
    step2: "...",
    step3: "...",
    step4: [],
    step5: "...",
    step6: "..."
  },
  structured_suggestions: [
    { icon: "📝", title: "词汇", detail: "建议..." }
  ]
}
```

### E2E环境说明
- 需要Playwright已安装
- 测试依赖本地服务运行在localhost:3000
- 需要有效的Supabase连接和LLM API配置

### 给主Agent的建议

#### 代码修改建议

1. **更新CreateCorrectionInput接口**（src/lib/db/corrections.ts）
   - 添加scoring_comments/correction_steps/structured_suggestions可选字段

2. **更新createCorrection函数**
   - 在insertData中包含新字段
   - 保持向后兼容的fallback逻辑

3. **更新getCorrectionById函数**
   - 查询结果自动包含新字段（使用select('*')已满足）
   - 确保返回类型正确

4. **更新correct API**（src/app/api/correct/route.ts）
   - 从AI响应中提取scoring_overview → scoring_comments
   - 提取correction_steps → correction_steps
   - 提取improvement_suggestions → structured_suggestions
   - 调用createCorrection时传入新字段

5. **向后兼容处理**
   - 页面展示层（corrections/[id]/page.tsx）使用可选链访问新字段
   - 新字段为null时显示旧字段数据（overall_comment/improvement_suggestions）

#### 关键测试验证点

1. **数据写入验证**：批改完成后直接查询DB验证新字段有值
2. **数据读取验证**：getCorrectionById返回包含新字段
3. **向后兼容验证**：旧记录（新字段为null）页面不报错
4. **类型安全**：TypeScript编译通过
5. **代码规范**：ESLint无错误

#### 测试执行步骤

```bash
# 1. 运行单元测试
npm test -- src/lib/db/corrections.test.ts
npm test -- src/lib/ai/llm.test.ts

# 2. 运行集成测试
npm test -- src/app/api/correct/route.test.ts

# 3. 构建验证
npm run build

# 4. 代码规范验证
npm run lint

# 5. 手动验证（需要运行服务）
# 触发一次真实批改，检查DB记录
```
