# KP作文宝 - 项目设计方案

> 本文档记录项目架构设计过程中的关键决策和完整设计方案，供后续参考。

---

## 产品背景

基于 PRD（KP作文宝小程序PRD V2.0，2026年3月16日），核心定位：

> 面向PET备考家庭的"AI写作教练+智能字帖生成器+个性化错题本"，通过**批改-积累-练习**的闭环帮助孩子提升写作能力和卷面分。

**目标用户**：11-15岁PET备考学生 + 30-50岁家长（决策者）

**MVP核心流程**：
1. 拍照上传手写作文
2. OCR识别手写英文
3. AI批改（PET三维评分 + 错误标注 + 亮点提取）
4. 选择范文目标级别（合格/优秀/卓越）→ 生成优化范文
5. 生成字帖PDF（PET答题卡格式）→ 下载打印

**MVP同时实现**：
- 亮点库（自动收集 + 手动添加）
- 易错点追踪（错误≥2次自动标记）
- 历史记录

---

## 技术选型决策

| 层级 | 技术选型 | 选择理由 |
|-----|---------|---------|
| 全栈框架 | Next.js 14+ (App Router) | 与已有 demo 保持一致，利于 agent 复用 |
| 语言 | TypeScript | 类型安全，减少运行时错误 |
| 样式 | Tailwind CSS | 快速开发，移动端适配 |
| 数据库 | Supabase (PostgreSQL) | 一体化 BaaS，含 Auth + Storage |
| OCR | 腾讯云手写OCR | PRD推荐，中国区低延迟，手写英文效果好 |
| LLM | Anthropic Claude (claude-sonnet-4-6) | 英语写作批改质量高，JSON输出稳定 |
| PDF生成 | pdfkit | Node.js原生，字体嵌入支持好，无浏览器依赖 |

---

## 数据模型设计

### 核心表结构

**essay_submissions**（作文提交）
- `id`, `user_id`, `original_image_path`, `ocr_text`, `title`, `status`(pending/processing/completed/failed), `created_at`

**corrections**（批改结果）
- `id`, `submission_id`, `content_score`(0-10), `communication_score`(0-10), `language_score`(0-10), `total_score`(0-30)
- `error_annotations`(JSONB), `overall_comment`, `improvement_suggestions`, `status`, `created_at`

**model_essays**（范文）
- `id`, `correction_id`, `target_level`(pass/good/excellent), `content`, `created_at`

**highlights_library**（亮点库）
- `id`, `user_id`, `text`, `type`(vocabulary/phrase/sentence), `source_submission_id`, `created_at`

**error_points**（易错点类型档案）
- `id`, `user_id`, `error_type`, `error_type_label`, `occurrence_count`, `is_flagged`(>=2次), `first_seen_at`, `last_seen_at`

**error_instances**（具体错误实例）
- `id`, `error_point_id`, `submission_id`, `original_sentence`, `corrected_sentence`, `explanation`, `created_at`

**copybooks**（字帖）
- `id`, `user_id`, `model_essay_id`, `font_style`(gochi-hand), `pdf_storage_path`, `pdf_url`, `created_at`

### error_annotations JSONB 结构

```json
[
  {
    "start": 12,
    "end": 17,
    "original": "go to",
    "corrected": "goes to",
    "error_type": "agreement",
    "explanation": "第三人称单数主语需要动词加-s",
    "severity": "error"
  }
]
```

### 错误类型分类

| error_type | 显示名称 |
|-----------|---------|
| tense | 时态错误 |
| agreement | 主谓一致 |
| preposition | 介词搭配 |
| spelling | 拼写错误 |
| punctuation | 标点符号 |
| vocabulary | 词汇使用 |
| article | 冠词错误 |
| other | 其他错误 |

---

## 页面结构

```
/ (首页) - 统计数据 + 拍照入口 + 近期历史
/login, /register - 认证
/upload - 3步：选图 → OCR确认 → 批改中
/corrections/[id] - 评分+标注+亮点+范文生成
/copybook/[id] - 字帖预览+下载
/highlights - 亮点库
/error-points - 易错点列表
/error-points/[id] - 易错点详情
/history - 历史记录
/profile - 个人设置
```

---

## API 设计

| 方法 | 路径 | 功能 |
|-----|------|-----|
| POST | /api/upload | 上传图片到 Supabase Storage |
| POST | /api/ocr | 腾讯云OCR识别 |
| POST/GET | /api/essays | 创建/列表 |
| GET | /api/essays/[id] | 详情（含批改+范文） |
| POST | /api/correct | AI批改核心（评分+亮点+错误追踪一步完成） |
| POST | /api/generate/model-essay | 按级别生成范文 |
| GET/POST/DELETE | /api/highlights, /api/highlights/[id] | 亮点库 CRUD |
| GET | /api/error-points, /api/error-points/[id] | 易错点查询 |
| POST | /api/generate/copybook | 生成字帖PDF |
| GET | /api/stats | 首页统计数据 |

---

## 关键设计决策

### 1. 批改API的原子性设计
`/api/correct` 在单次调用中完成：保存批改结果 + 保存亮点到亮点库 + 更新易错点档案。
避免部分保存导致数据不一致。

### 2. 错误标注的字符偏移方案
`error_annotations` 使用 `start/end` 字符偏移量指向 OCR 文本，前端 `AnnotatedEssay` 组件据此分割文本为带高亮的 span 元素。

### 3. 易错点的 upsert + 自动标记
每次批改后对每类错误执行 upsert（存在则+1，不存在则创建），然后检查是否 >=2 次并自动设置 `is_flagged=true`。

### 4. 字帖 PDF 缓存
同一 `model_essay_id` 已有 copybook 记录时直接返回，不重复生成 PDF。

### 5. Supabase Storage 桶设计
- `essay-images`：私有桶，需要 signed URL 访问（用户隐私）
- `copybook-pdfs`：公开桶，可直接通过 URL 在 iframe 中预览

---

## 任务拆分概览（40个任务）

### 第一阶段：基础设施（任务 1-6）
1. 项目基础配置（Next.js初始化 + 依赖安装）
2. Supabase 数据库 Schema（所有表 + RLS + Storage）
3. Supabase 客户端封装 + 认证中间件
4. 用户认证（登录/注册/登出）
5. 全局布局（Header + BottomNav）
6. 通用 UI 组件库（Button/Card/Input/Toast 等）

### 第二阶段：外部 API 封装（任务 7-9）
7. 腾讯云 OCR API 封装
8. Claude AI 批改模块封装（含 Prompt 设计）
9. pdfkit 字帖 PDF 生成模块

### 第三阶段：数据访问层（任务 10-15）
10. 作文提交数据访问层
11. 批改+范文数据访问层
12. 亮点库数据访问层
13. 易错点数据访问层（含自动标记逻辑）
14. 字帖 + Storage 工具函数
15. 统计数据访问层

### 第四阶段：API Routes（任务 16-24）
16-24. 各功能 API 路由实现

### 第五阶段：前端页面（任务 25-34）
25-34. 各页面 UI 实现

### 第六阶段：打磨（任务 35-40）
35. Loading 状态和骨架屏
36. 错误处理和边界情况
37. 响应式设计和移动端适配
38. 字体资源集成（Gochi Hand）
39. 端到端流程测试
40. 性能优化和最终打磨

---

## 环境变量清单

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
TENCENT_SECRET_ID=
TENCENT_SECRET_KEY=
TENCENT_OCR_REGION=ap-guangzhou
```

---

## V2.0 预留功能（MVP不实现，代码中注释标记）

- 错题练习纸 PDF（填空题，基于 error_instances）
- 每周提醒推送（cron + 邮件）
- 亮点向量检索（pgvector + embedding）
- KET 作文支持
- 图文知识点讲解（knowledge_base 表）
- 付费订阅模式
