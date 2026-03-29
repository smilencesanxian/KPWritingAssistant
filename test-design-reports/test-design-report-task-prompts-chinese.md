# 测试设计报告 - AI提示词中文输出

## 任务概述

将所有AI提示词的输出结果改为中文，保留英文的字段只有：
- 范文（model_essay）
- 原文片段（original text）
- 错误类型标识（error_type 等结构化字段的值）

## 涉及的提示词文件

**文件路径**: `KPWritingAssistant-web/src/config/prompts.json`

### 包含的模块

1. **correction（批改）** - systemPrompt, part1ExtraGuidance, part2ExtraGuidance
2. **modelEssay（范文生成）** - systemPrompt, part1SystemPrompt, part2SystemPrompt, userPromptTemplate
3. **ocr（文字识别）** - userPrompt
4. **detectType（题型识别）** - systemPrompt

---

## 测试范围

### 1. 单元测试范围

#### 1.1 配置文件结构验证
- 验证 prompts.json 文件结构完整
- 验证所有必要字段存在
- 验证 JSON 格式正确

#### 1.2 提示词内容验证
- 验证中文要求指令已添加到各模块
- 验证保留英文的字段未被修改
- 验证错误类型标识保持英文

### 2. 集成测试范围

#### 2.1 AI 服务调用验证
- 验证修改后的提示词能正确传递给 AI 服务
- 验证 AI 返回结果符合中文要求
- 验证 JSON 解析正常

#### 2.2 端到端流程验证
- 批改流程：提交作文 → AI 批改 → 返回中文评语
- 范文生成流程：选择水平 → AI 生成 → 返回中文建议
- 题型识别流程：提交作文 → AI 识别 → 返回中文题型标签

---

## 测试用例清单

### 单元测试

| 用例ID | 描述 | 测试内容 | 预期结果 | 优先级 |
|--------|------|----------|----------|--------|
| UT-001 | 配置文件结构完整性 | 验证 prompts.json 包含所有必要模块 | 文件包含 correction, modelEssay, ocr, detectType 四个模块 | 高 |
| UT-002 | JSON 格式有效性 | 验证 prompts.json 是合法 JSON | 无语法错误，可正常解析 | 高 |
| UT-003 | correction.systemPrompt 中文要求 | 验证 systemPrompt 包含中文输出指令 | 包含明确要求 AI 用中文返回评语的指令 | 高 |
| UT-004 | correction.part1ExtraGuidance 中文要求 | 验证 part1ExtraGuidance 包含中文输出指令 | 包含中文评语要求 | 高 |
| UT-005 | correction.part2ExtraGuidance 中文要求 | 验证 part2ExtraGuidance 包含中文输出指令 | 包含中文评语要求 | 高 |
| UT-006 | modelEssay.systemPrompt 中文要求 | 验证 systemPrompt 包含中文建议要求 | 包含中文改进建议要求 | 高 |
| UT-007 | modelEssay.part1SystemPrompt 中文要求 | 验证 part1SystemPrompt 包含中文建议要求 | 包含中文改进建议要求 | 高 |
| UT-008 | modelEssay.part2SystemPrompt 中文要求 | 验证 part2SystemPrompt 包含中文建议要求 | 包含中文改进建议要求 | 高 |
| UT-009 | detectType.systemPrompt 中文要求 | 验证 systemPrompt 包含中文标签要求 | 明确要求返回中文 essay_type_label 和 topic | 高 |
| UT-010 | 保留英文字段验证 - model_essay | 验证范文生成提示词未要求中文范文 | model_essay 要求保持英文输出 | 高 |
| UT-011 | 保留英文字段验证 - highlights.text | 验证亮点原文片段保持英文 | highlights.text 不要求翻译 | 高 |
| UT-012 | 保留英文字段验证 - correction_steps.step4.original | 验证错误原文保持英文 | original 字段不要求翻译 | 高 |
| UT-013 | 保留英文字段验证 - error_type | 验证错误类型标识保持英文 | error_type 枚举值保持英文 | 高 |

### 集成测试

| 用例ID | 描述 | 测试内容 | 预期结果 | 优先级 |
|--------|------|----------|----------|--------|
| IT-001 | 批改 API 中文输出 | 调用批改服务，验证返回评语为中文 | scoring_overview 中 comment 字段为中文 | 高 |
| IT-002 | 批改步骤中文输出 | 验证 correction_steps 各步骤描述为中文 | step1-step6 为中文描述 | 高 |
| IT-003 | 改进建议中文输出 | 验证 improvement_suggestions 为中文 | title 和 detail 为中文 | 高 |
| IT-004 | 亮点原因中文输出 | 验证 highlights.reason 为中文 | reason 字段为中文说明 | 高 |
| IT-005 | 题型识别中文输出 | 验证 detectType 返回中文标签 | essay_type_label 和 topic 为中文 | 高 |
| IT-006 | 范文保持英文 | 验证 model_essay 为英文 | 范文内容为英文 | 高 |
| IT-007 | 错误原文保持英文 | 验证 correction_steps.step4.original 为英文 | 原文错误片段为英文 | 高 |
| IT-008 | 错误类型保持英文 | 验证 error_type 为英文标识 | error_type 值为英文枚举 | 高 |

### E2E 测试

| 用例ID | 用户场景 | 操作步骤 | 预期结果 | 优先级 |
|--------|----------|----------|----------|--------|
| E2E-001 | 用户提交作文批改 | 1. 进入批改页面<br>2. 输入英文作文<br>3. 点击批改按钮 | 1. 页面显示加载状态<br>2. 批改完成后显示中文评语<br>3. 各维度评分为数字<br>4. 改进建议为中文 | 高 |
| E2E-002 | 用户查看批改详情 | 1. 进入批改结果页<br>2. 查看各维度评分<br>3. 展开详细批改步骤 | 1. 评分评语为中文<br>2. 批改步骤描述为中文<br>3. 错误标注原文为英文<br>4. 亮点说明为中文 | 高 |
| E2E-003 | 用户生成范文 | 1. 在批改结果页点击生成范文<br>2. 选择目标水平<br>3. 查看生成结果 | 1. 范文为英文<br>2. 改进建议标题和详情为中文 | 高 |
| E2E-004 | 用户查看历史记录 | 1. 进入历史记录页面<br>2. 查看过往批改记录 | 1. 题型标签为中文<br>2. 主题词为中文<br>3. 评分概要为中文 | 中 |

---

## 边界情况

### 1. 特殊字符处理
- 中文评语中包含引号、换行符时的 JSON 转义
- 混合中英文内容时的正确显示

### 2. 空值处理
- AI 返回空评语时的处理
- 部分字段缺失时的降级显示

### 3. 长文本处理
- 中文评语较长时的换行和截断
- 改进建议详情较长时的显示优化

### 4. 网络异常
- AI 服务超时时的错误提示（应为中文）
- 网络中断时的重试机制

---

## 验证输出是否为中文的方法

### 1. 正则表达式检测
```typescript
// 检测字符串包含中文字符
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

// 检测字符串主要为中文（中文字符占比 > 50%）
function isMainlyChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  return chineseChars.length / text.length > 0.5;
}
```

### 2. 具体字段验证
```typescript
// 验证批改结果
interface CorrectionResult {
  scoring_overview: {
    content: { comment: string };      // 应包含中文
    communication: { comment: string }; // 应包含中文
    organisation: { comment: string };  // 应包含中文
    language: { comment: string };      // 应包含中文
  };
  correction_steps: {
    step1: string;  // 应为中文
    step2: string;  // 应为中文
    step3: string;  // 应为中文
    step4: Array<{
      original: string;      // 应为英文（原文）
      error_type: string;    // 应为英文（标识）
      suggestion: string;    // 应为中文
    }>;
    step5: string;  // 应为中文
    step6: string;  // 应为中文
  };
  improvement_suggestions: Array<{
    title: string;   // 应为中文
    detail: string;  // 应为中文
  }>;
  highlights: Array<{
    text: string;    // 应为英文（原文）
    reason: string;  // 应为中文
  }>;
  model_essay: string;  // 应为英文
}

// 验证题型识别结果
interface DetectTypeResult {
  essay_type_label: string;  // 应为中文（如"邮件"、"文章"）
  topic: string;             // 应为中文（如"露营旅行"）
}
```

### 3. 负面测试（应不为中文）
```typescript
// 这些字段应该保持英文
const shouldBeEnglish = [
  result.model_essay,
  result.highlights[0].text,
  result.correction_steps.step4[0].original,
  result.correction_steps.step4[0].error_type,
];
```

---

## 测试文件位置

### 单元测试
- `KPWritingAssistant-web/src/config/prompts.test.ts` - 配置文件验证

### 集成测试
- `KPWritingAssistant-web/src/services/__tests__/correction.test.ts` - 批改服务测试
- `KPWritingAssistant-web/src/services/__tests__/detectType.test.ts` - 题型识别测试

### E2E 测试
- `KPWritingAssistant-web/tests/e2e/correction-chinese.spec.ts` - 批改中文输出测试
- `KPWritingAssistant-web/tests/e2e/model-essay-chinese.spec.ts` - 范文生成测试

---

## 给主 Agent 的建议

### 1. 提示词修改要点

在 `prompts.json` 的以下位置添加中文输出要求：

**correction.systemPrompt**:
- 在 JSON 结构说明中，明确标注 `comment` 字段必须是中文
- 在 `correction_steps` 说明中，明确 step1-step6 必须是中文
- 在 `improvement_suggestions` 说明中，明确 title 和 detail 必须是中文
- 在 `highlights` 说明中，确认 reason 已经是中文要求

**modelEssay 各 systemPrompt**:
- 添加要求返回中文改进建议的指令

**detectType.systemPrompt**:
- 在 Topic 提取规则中，明确要求返回中文主题词
- 确认 essay_type_label 已经是中文要求

### 2. 可测试性建议

- 在 AI 服务层添加日志，记录原始 AI 返回内容，便于调试
- 考虑添加运行时校验，确保 AI 返回符合语言要求
- 对于关键字段，可在前端添加语言检测，不符合时给出警告

### 3. 回滚方案

建议修改前备份原 prompts.json，以便在 AI 输出质量下降时快速回滚。

---

## 总结

本测试设计覆盖了：
- **13 个单元测试用例** - 验证配置文件结构和提示词内容
- **8 个集成测试用例** - 验证 AI 服务返回结果
- **4 个 E2E 测试用例** - 验证用户完整使用流程

所有测试用例均明确了中文/英文的判定标准，便于自动化测试实现。
