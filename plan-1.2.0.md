# KP作文宝 v1.2.0 详细设计方案

## Context

当前项目 v1.0.0 MVP 已完成，包含：拍照上传 → OCR识别 → AI批改(4维度20分) → 亮点库 → 错题本 → 范文生成 → 字帖PDF下载 的完整闭环。v1.2.0 跳过 v1.1.0，在此基础上新增4个功能并修复6个问题。

---

## 需求清单

### 新增功能
| ID | 功能 | 优先级 |
|----|------|--------|
| F1 | 题目类型自动识别（Part1/Part2/Q1/Q2）并针对性批改 | P0 |
| F2 | 范文编辑 + 用户偏好记录 | P1 |
| F3 | 推荐句式库（系统推荐 + 用户收藏 + 范文生成时择优选用）| P1 |
| F4 | 写作导览思维导图（作文类型→主题→亮点词句的关联展示）| P2 |

### Bug修复 & 已有功能调整
| ID | 问题 | 优先级 |
|----|------|--------|
| B1 | OCR噪音过滤（如"3张"）+ 上传流程优化（上传两张照片：题目+作文）| P0 |
| B2 | 批改Loading改进：展示4个维度评分原则，而非进度消息轮换 | P0 |
| B3 | 原文批注信息量不足，需根据批改输出格式重新设计 | P1 |
| B4 | 字帖PDF下载命名：`PET [partX] 范文 [主题] [生成日期].pdf` | P1 |
| B5 | 邮件类范文格式修复（称呼/祝福语/署名换行，去除明显错误逻辑）| P1 |
| B6 | 字帖字体加大、单词放在横线上、每行10词、右侧不留白 | P1 |

---

## 一、数据库变更方案

### Migration 004: 核心字段扩展

```sql
-- 1. essay_submissions 增加题型信息
ALTER TABLE essay_submissions
  ADD COLUMN exam_part VARCHAR(10),          -- 'part1' | 'part2'
  ADD COLUMN question_type VARCHAR(10),       -- 'q1' | 'q2'（仅part2）
  ADD COLUMN question_image_path TEXT,        -- 题目照片路径
  ADD COLUMN question_ocr_text TEXT,          -- 题目OCR文本
  ADD COLUMN essay_topic TEXT;               -- AI识别的题目主题（用于PDF命名）

-- 2. model_essays 增加用户编辑支持
ALTER TABLE model_essays
  ADD COLUMN user_edited_content TEXT,        -- 用户编辑后的内容
  ADD COLUMN is_user_edited BOOLEAN DEFAULT false,
  ADD COLUMN edit_history JSONB DEFAULT '[]', -- [{timestamp, original, edited, note}]
  ADD COLUMN user_preference_notes TEXT;      -- 用户对本次范文的编辑提示

-- 3. highlights_library 增加来源标识
ALTER TABLE highlights_library
  ADD COLUMN source VARCHAR(20) DEFAULT 'user', -- 'user' | 'system'
  ADD COLUMN recommended_phrase_id UUID;         -- 关联推荐句式表
```

### Migration 005: 推荐句式库 + 写作导览

```sql
-- 4. 推荐句式表（系统级，无user_id）
CREATE TABLE recommended_phrases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('vocabulary', 'phrase', 'sentence')),
  essay_type VARCHAR(50),           -- 'email' | 'article' | 'story' | 'report' | NULL(通用)
  topic_tags TEXT[] DEFAULT '{}',   -- ['camping', 'travel', 'school']
  usage_example TEXT,               -- 使用示例
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 写作导览节点（思维导图数据）
CREATE TABLE writing_guide_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL=系统推荐
  parent_id UUID REFERENCES writing_guide_nodes(id),
  node_type VARCHAR(20) NOT NULL,   -- 'essay_type' | 'topic' | 'highlight'
  label TEXT NOT NULL,
  highlight_id UUID REFERENCES highlights_library(id) ON DELETE SET NULL,
  source VARCHAR(20) DEFAULT 'system', -- 'user' | 'system'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: writing_guide_nodes 用户只读自己数据，系统推荐对所有人可见
-- RLS: recommended_phrases 全员只读
```

**注意**：需向`highlights_library`的`recommended_phrase_id`添加FK约束（迁移时用）

---

## 二、API 变更方案

### 新增 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/detect-type` | 输入：题目图片URL+作文OCR文本，输出：exam_part/question_type/topic |
| `PUT` | `/api/model-essays/[id]` | 保存用户编辑后的范文 |
| `POST` | `/api/model-essays/[id]/regenerate` | 基于用户提示重新生成范文 |
| `GET` | `/api/recommended-phrases` | 获取系统推荐句式（支持type/essay_type筛选）|
| `POST` | `/api/recommended-phrases/[id]/collect` | 收藏推荐句式到个人亮点库 |
| `GET` | `/api/writing-guide` | 获取用户的写作导览树（含系统推荐节点）|

### 修改 API

| 路径 | 变更内容 |
|------|---------|
| `POST /api/essays` | 接收 `question_image_path`, `question_ocr_text`, `exam_part`, `question_type`, `essay_topic` |
| `POST /api/correct` | 接收 `exam_part`，根据题型使用不同的评分标准提示词 |
| `POST /api/generate/copybook` | 接收 `exam_part` 用于PDF文件命名 |

---

## 三、功能详细设计

### F1 + B1：上传流程重构（题目类型识别 + 两张照片）

**当前流程**：选一张作文图片 → OCR → 确认 → 批改

**新流程**：
```
Step 1: 选择照片
  ├─ 上传"题目照片"（可选）
  └─ 上传"作文照片"（必须）

Step 2: AI识别（无需用户干预，自动进行）
  ├─ 并行：作文OCR识别
  ├─ 并行：题目OCR识别（如有）
  └─ AI判断：Part1 / Part2-Q1 / Part2-Q2

Step 3: 识别结果确认
  ├─ 展示：题型标签（Part 1 邮件 / Part 2 Question 1 文章）
  ├─ 展示：作文识别文本（可编辑）
  └─ 提示：如识别有误可手动修改题型

Step 4: 进入批改（展示评分维度原则，见B2）
```

**OCR噪音过滤逻辑**：
- 在`/api/ocr`返回后，后端用正则过滤：纯数字+"张"、纯数字+"页"等模式
- 对于疑似噪音词，记录到日志但从返回文本中去除
- 文件：`src/lib/ocr/index.ts` 的 `cleanOcrText()` 函数

**题型识别逻辑**（`/api/detect-type`）：
- 输入：题目OCR文本 + 作文OCR文本
- 用LLM分析关键词：有"Dear/Hi + 人名"开头 → Part1邮件；有"Question 1/2"标识或故事/文章体裁 → Part2
- 返回：`{ exam_part, question_type, essay_type_label, topic, confidence }`

### B2：批改Loading界面改进

**改前**：轮播消息（分析内容→检查语法→提取亮点→即将完成）

**改后**：展示4个评分维度的标准卡片，静态展示，不再轮播

UI设计：
```
[AI 正在批改中] 🔄

┌─────────────────────────────────┐
│ 📝 Content 内容要点          /5 │
│   完整覆盖要点 + 充实细节        │
├─────────────────────────────────┤
│ 💬 Communicative Achievement /5 │
│   格式规范，语气恰当             │
├─────────────────────────────────┤
│ 📊 Organisation 组织结构     /5 │
│   分段清晰，逻辑连贯            │
├─────────────────────────────────┤
│ 🔤 Language 语言质量         /5 │
│   词汇丰富，语法多样            │
└─────────────────────────────────┘
```

文件：`src/app/upload/page.tsx` 的 correcting step

### B3：原文批注界面重设计

**现状**：AnnotatedEssay组件只在文本上标红色下划线，点击显示Tooltip

**改进方案**：
- 保留下划线标注交互
- Tooltip改为侧拉抽屉（底部弹出，移动端友好）
- 抽屉内容展示：
  - 错误类型标签（语法/词汇/拼写等）
  - 严重程度（critical/major/minor）
  - 原文：`I don't like the sport`
  - 纠正：`I don't enjoy playing sports`
  - 解释：`'enjoy' 比 'like' 更自然，搭配动名词`
- 底部摘要栏：显示共X处错误，按类型分组计数

文件：`src/components/correction/AnnotatedEssay.tsx`（重构）

### B4：PDF命名修改

**改前**：`b1708edf-4ca6-433f-906c-c1c562e7098c.pdf`

**改后**：`PET Part1 范文 露营旅行 2026-03-24.pdf`

实现：
- `essay_topic` 在 detect-type 阶段由AI提取（中文主题词）
- 字帖生成时从 `essay_submissions.essay_topic` 读取
- 文件：`src/app/api/generate/copybook/route.ts`

```typescript
const fileName = `PET ${examPart} 范文 ${essayTopic || '作文'} ${format(new Date(), 'yyyy-MM-dd')}.pdf`
```

### B5：邮件格式修复

**改进 prompts.json**：
1. 邮件格式的系统提示中明确要求：
   - `Dear/Hi [Name],` 后必须换行
   - 正文段落间换行
   - `Best wishes,` 后必须换行
   - 署名单独一行
2. 增加 negative example：避免 `I don't have anything I dislike too much` 这类逻辑不自然的表达
3. 增加指令：批改时指出逻辑不当，范文生成时修正而非保留

文件：`src/config/prompts.json`（修改 model_essay system prompt）

### B6：字帖布局修复

**问题**：字体小、单词在两线中央、右侧留白多

**修复方案**（`src/lib/pdf/renderer.ts`）：
1. 默认字号从当前值上调（建议18pt作为新默认值）
2. 文字Y坐标从"行中央"改为"靠近下线上方约2pt"（baseline位置）
3. 单行词数控制算法：目标10词，超出则换行（当前逻辑review）
4. 右侧对齐：用justify方式分配单词间距，避免右侧留白

### F2：范文编辑功能

**UI设计**（在 `/corrections/[id]` 的范文区域）：
```
[范文内容区]
                          [编辑范文] [重新生成]

编辑范文 → Modal打开：
  ┌─ 直接编辑模式 ─────────────────┐
  │ [富文本/纯文本编辑区]           │
  │ Hi Ella,                       │
  │ I'm thrilled...                │
  │                                │
  │ [取消]        [保存这个版本]    │
  └────────────────────────────────┘

重新生成 → 底部弹出：
  ┌─ 告诉AI如何改进 ───────────────┐
  │ 例如：更正式一些，加入描述性词汇  │
  │ [输入框]                       │
  │ [取消]     [重新生成范文]       │
  └────────────────────────────────┘
```

**数据流**：
- 保存编辑：`PUT /api/model-essays/[id]` → 保存到 `user_edited_content`，原始内容不删除
- 重新生成：`POST /api/model-essays/[id]/regenerate` → 传入 `preference_notes` → LLM重新生成 → 保存新内容

**偏好学习**（轻量版）：
- 将用户的编辑notes存入 `model_essays.user_preference_notes`
- 下次为该用户生成范文时，读取最近5条notes拼入system prompt

### F3：推荐句式库

**亮点库页面改造**：
- Tab栏新增"推荐"tab
- 推荐tab内展示 `recommended_phrases`，按 `essay_type` 分组
- 每条推荐句式：
  - 文字内容
  - 类型标签（词汇/短语/句子）
  - 适用场景标签（邮件/文章等）
  - ✚ 收藏按钮（收藏后变为 ✓）

**收藏逻辑**：
- 调用 `POST /api/recommended-phrases/[id]/collect`
- 将该句式插入 `highlights_library`，source='system'，记录 `recommended_phrase_id`
- 收藏后在用户的"全部/词汇/短语/句子"tab中也可见，带"推荐"小角标

**范文生成时的选用逻辑**：
- `POST /api/generate/model-essay` 时，额外查询用户已收藏的系统推荐句式
- 在 model essay prompt 中的 highlights 部分，加入收藏的推荐句式
- 提示词：`优先在合适场景下使用以下收藏的写作表达`

**初始推荐句式数据**（种子数据，20-30条）：
- Part1 邮件类：`I'm writing to ask about...`, `I would be grateful if you could...`
- Part2 文章类：`In my opinion...`, `There are several reasons why...`
- 通用连接词：`Furthermore,`, `However,`, `As a result,`

文件位置：`supabase/seed/recommended_phrases.sql`

### F4：写作导览（思维导图）

**设计哲学**：移动端优先，采用可折叠树状列表（而非传统思维导图），适合手机竖屏。

**数据结构**：
```
Level 0（根）: 作文类型
  └─ Level 1: 话题/场景
       └─ Level 2: 亮点词句
```

示例：
```
📧 邮件 (Part 1)
  ├─ 🏕️ 户外活动
  │    ├─ ✨ "I'm thrilled about the idea of..." [用户积累]
  │    ├─ ⭐ "outdoor adventure" [系统推荐]
  │    └─ ...
  └─ 🏫 学校生活
       └─ ...
📰 文章 (Part 2)
  └─ ...
```

**新用户体验**：
- 亮点库为空时，显示完整的系统推荐思维导图
- 节点标记：金色 ✨ = 用户积累，灰色 ⭐ = 系统推荐
- 系统推荐节点不可删除，可收藏

**动态更新机制**：
- 每次批改完成，AI提取亮点时同步更新该用户的写作导览节点
- 通过`essay_topic`将亮点挂载到对应的话题节点下

**新增底部导航项**：
- 当前：历史 | 亮点库 | 易错点
- 新增：写作导览（在亮点库和易错点之间，图标：🗺️）
- 页面路由：`/writing-guide`

**页面路由**：`src/app/writing-guide/page.tsx`

---

## 四、涉及修改的关键文件清单

### 数据库
- `supabase/migrations/004_v120_exam_part_model_edit.sql` （新建）
- `supabase/migrations/005_v120_recommended_phrases_writing_guide.sql` （新建）
- `supabase/seed/recommended_phrases.sql` （新建）

### 类型定义
- `src/types/database.ts` —— 新增字段类型

### 数据访问层
- `src/lib/db/essays.ts` —— 支持exam_part字段
- `src/lib/db/corrections.ts` —— 查询时join exam_part
- `src/lib/db/model-essays.ts` —— 新增编辑/保存方法
- `src/lib/db/highlights.ts` —— 新增source/recommended_phrase_id字段
- `src/lib/db/recommended-phrases.ts` —— 新建
- `src/lib/db/writing-guide.ts` —— 新建

### AI层
- `src/config/prompts.json` —— 修改批改/范文提示词，新增detect-type提示词
- `src/lib/ai/prompts.ts` —— 新增 `buildDetectTypePrompt`, `buildRegenerateEssayPrompt`
- `src/lib/ocr/index.ts` —— 新增 `cleanOcrText()` 噪音过滤

### API层
- `src/app/api/detect-type/route.ts` （新建）
- `src/app/api/model-essays/[id]/route.ts` （新建）
- `src/app/api/model-essays/[id]/regenerate/route.ts` （新建）
- `src/app/api/recommended-phrases/route.ts` （新建）
- `src/app/api/recommended-phrases/[id]/collect/route.ts` （新建）
- `src/app/api/writing-guide/route.ts` （新建）
- `src/app/api/correct/route.ts` —— 支持exam_part参数
- `src/app/api/essays/route.ts` —— 接收题目照片/OCR
- `src/app/api/generate/copybook/route.ts` —— 修复PDF命名

### 组件层
- `src/components/correction/AnnotatedEssay.tsx` —— 重构（B3）
- `src/components/highlights/RecommendedPhraseCard.tsx` （新建）
- `src/components/model-essay/EditEssayModal.tsx` （新建）
- `src/components/model-essay/RegenerateModal.tsx` （新建）
- `src/components/writing-guide/WritingGuideTree.tsx` （新建）
- `src/components/layout/BottomNav.tsx` —— 新增写作导览导航

### 页面层
- `src/app/upload/page.tsx` —— 重构上传流程（两张照片 + B2 loading改进）
- `src/app/corrections/[id]/page.tsx` —— 添加范文编辑入口
- `src/app/highlights/page.tsx` —— 添加推荐tab
- `src/app/writing-guide/page.tsx` （新建）

### PDF引擎
- `src/lib/pdf/renderer.ts` —— B6字帖布局修复

---

## 五、开发任务拆分（按依赖顺序）

### Phase 1：基础设施（先做，其他依赖）
1. DB迁移004 + 005
2. 更新types/database.ts
3. 更新数据访问层

### Phase 2：上传流程重构（P0）
4. OCR噪音过滤 `cleanOcrText()`
5. 题型识别API `/api/detect-type`
6. 上传页面重构（两张照片 + loading改进）

### Phase 3：批改体验改进（P1）
7. 修复批改提示词（邮件格式 + 逻辑过滤）
8. 原文批注重设计
9. 范文编辑功能（API + UI）

### Phase 4：PDF & 字帖修复（P1）
10. PDF命名修复
11. 字帖布局优化

### Phase 5：推荐句式库（P1）
12. 推荐句式API + 种子数据
13. 亮点库页面增加推荐tab
14. 范文生成集成推荐句式

### Phase 6：写作导览（P2）
15. 写作导览API
16. 写作导览页面（树状列表）
17. 底部导航更新

---

## 六、验证方案

### 端到端测试场景
1. **F1验证**：上传一张PET邮件题目照片 + 一张作文照片，验证自动识别为"Part1邮件"，并用Part1评分标准批改
2. **F2验证**：生成范文后，点击"编辑范文"保存，刷新后确认内容持久化；点击"重新生成"输入提示后验证新内容生成
3. **F3验证**：推荐tab有内容显示；收藏一条后在用户亮点库可见；生成范文时包含该表达
4. **F4验证**：新用户看到系统推荐思维导图；批改后用户节点增加；节点有来源区分标记
5. **B1验证**：OCR结果无"3张"等噪音；上传流程提示上传两张照片
6. **B4验证**：下载字帖文件名为`PET Part1 范文 露营旅行 2026-03-24.pdf`格式
7. **B5验证**：生成的邮件范文中称呼、祝福语、署名各自独立换行
8. **B6验证**：字帖中文字大小合适，单词在横线上方，每行约10个词

### 构建验证
```bash
npm run lint    # 无错误
npm run build   # 构建成功
```
