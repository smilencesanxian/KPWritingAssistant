# 测试设计报告 - Task 31: KB-1 知识库表结构扩展 + 系统初始知识种子数据

## 功能概述

扩展 `recommended_phrases` 表，新增 `category`（功能分类）和 `level`（基础/高级）字段，支持 `story` 类型，并向 `highlights_library` 新增 `knowledge_essay_type` 字段用于用户手动添加的知识条目。同时插入约60条来自 PET写作知识库的系统初始知识数据。

---

## 测试分层策略

| 测试层次 | 用例数量 | 覆盖范围说明 |
|---------|---------|-------------|
| 单元测试 | 不适用 | 数据库迁移无业务逻辑，无需单元测试 |
| 集成测试 | 不适用 | 迁移脚本直接操作数据库，无API接口测试 |
| 数据库迁移测试 | 12个用例 | 验证DDL/DML语句正确性、约束完整性、数据完整性 |
| 构建测试 | 2个用例 | 验证 `npm run build` 和 `npm run lint` 无错误 |

---

## 测试用例清单

### 数据库迁移测试

#### 表结构变更测试

| 用例ID | 描述 | 测试步骤 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| DB-001 | 验证 category 字段存在 | 1. 执行迁移脚本<br>2. 查询表结构 `\d recommended_phrases` | `category` 字段存在，类型为 `TEXT`，允许 NULL | 高 |
| DB-002 | 验证 level 字段存在及约束 | 1. 执行迁移脚本<br>2. 查询表结构<br>3. 尝试插入非法值 'intermediate' | `level` 字段存在，类型为 `TEXT`，约束 `CHECK (level IN ('basic', 'advanced'))`，非法值插入失败 | 高 |
| DB-003 | 验证 essay_type 支持 story | 1. 执行迁移脚本<br>2. 尝试插入 `essay_type='story'` 的数据 | 插入成功，无约束错误 | 高 |
| DB-004 | 验证 highlights_library 新增字段 | 1. 执行迁移脚本<br>2. 查询表结构 `\d highlights_library` | `knowledge_essay_type` 字段存在，类型为 `TEXT`，允许 NULL | 高 |
| DB-005 | 验证 knowledge_essay_type 约束 | 1. 执行迁移脚本<br>2. 尝试插入非法值 'invalid_type' | 插入失败，违反 CHECK 约束 | 中 |
| DB-006 | 验证 level 字段允许 NULL | 1. 执行迁移脚本<br>2. 插入 level 为 NULL 的记录 | 插入成功 | 中 |

#### 种子数据测试

| 用例ID | 描述 | 测试步骤 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| DB-007 | 验证种子数据总量 | 1. 执行迁移脚本<br>2. 执行 `SELECT count(*) FROM recommended_phrases WHERE category IS NOT NULL` | 返回结果 ≥ 50 | 高 |
| DB-008 | 验证邮件类种子数据 | 1. 执行查询 `SELECT category, level, count(*) FROM recommended_phrases WHERE essay_type='email' GROUP BY category, level` | 包含 opening/opinion/connector/detail/closing 各分类，每类有 basic 和 advanced 两级，共约20条 | 高 |
| DB-009 | 验证文章类种子数据 | 1. 执行查询 `SELECT category, level, count(*) FROM recommended_phrases WHERE essay_type='article' GROUP BY category, level` | 包含 title/opening/closing 分类，有 basic/advanced 分级，共约8条 | 高 |
| DB-010 | 验证故事类种子数据 | 1. 执行查询 `SELECT category, level, count(*) FROM recommended_phrases WHERE essay_type='story' GROUP BY category, level` | 包含 opening/plot/emotion 分类，有 basic/advanced 分级，共约8条 | 高 |
| DB-011 | 验证通用类种子数据 | 1. 执行查询 `SELECT category, level, count(*) FROM recommended_phrases WHERE essay_type='general' GROUP BY category, level` | 包含 emotion_vocab/action_vocab/adverb/complex_sentence 分类，有 basic/advanced 分级，共约16条 | 高 |
| DB-012 | 验证四类数据覆盖完整 | 1. 执行 `SELECT DISTINCT essay_type FROM recommended_phrases WHERE category IS NOT NULL` | 返回 email, article, story, general 四类 | 高 |

#### 幂等性测试

| 用例ID | 描述 | 测试步骤 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| DB-013 | 验证迁移可重复执行 | 1. 首次执行迁移脚本<br>2. 再次执行相同脚本 | 第二次执行无错误，不重复插入种子数据 | 中 |

### 构建测试

| 用例ID | 描述 | 测试步骤 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| BUILD-001 | 验证 npm run build 成功 | 1. 执行 `npm run build` | 构建成功，无错误输出 | 高 |
| BUILD-002 | 验证 npm run lint 通过 | 1. 执行 `npm run lint` | 无 lint 错误 | 高 |

---

## 测试执行步骤

### 前置条件

1. 本地 PostgreSQL/Supabase 数据库已启动
2. 数据库已应用 migration 001-007
3. 已配置数据库连接环境变量

### 执行步骤

```bash
# 1. 进入项目目录
cd /mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant/KPWritingAssistant-web

# 2. 执行数据库迁移（通过 Supabase CLI 或直接执行 SQL）
supabase db reset  # 或使用 psql 直接执行
psql $DATABASE_URL -f supabase/migrations/008_knowledge_base_expand.sql

# 3. 验证表结构变更
psql $DATABASE_URL -c "\d recommended_phrases"
psql $DATABASE_URL -c "\d highlights_library"

# 4. 验证约束
psql $DATABASE_URL -c "INSERT INTO recommended_phrases (text, type, essay_type, level) VALUES ('test', 'phrase', 'email', 'invalid')"  # 应失败
psql $DATABASE_URL -c "INSERT INTO recommended_phrases (text, type, essay_type, level) VALUES ('test', 'phrase', 'story', 'basic')"  # 应成功

# 5. 验证种子数据
psql $DATABASE_URL -c "SELECT count(*) FROM recommended_phrases WHERE category IS NOT NULL"
psql $DATABASE_URL -c "SELECT essay_type, category, level, count(*) FROM recommended_phrases WHERE category IS NOT NULL GROUP BY essay_type, category, level ORDER BY essay_type, category, level"

# 6. 验证构建
npm run build
npm run lint
```

---

## 已创建的测试文件

本任务为数据库迁移脚本，测试通过手动执行 SQL 验证和构建命令完成，无需创建专门的测试代码文件。

---

## 给主 Agent 的建议

### 迁移脚本编写建议

1. **使用 `IF NOT EXISTS`**：所有 ALTER TABLE 操作使用 `IF NOT EXISTS` 确保幂等性
2. **约束删除重建**：修改 essay_type 约束时，先 DROP CONSTRAINT 再 ADD CONSTRAINT
3. **种子数据去重**：使用 `ON CONFLICT` 或 `WHERE NOT EXISTS` 避免重复插入
4. **事务包裹**：建议将整个迁移包裹在事务中，确保原子性

### 示例迁移脚本结构

```sql
-- ============================================================
-- Migration 008: Knowledge Base Expansion
-- ============================================================

-- 1. 扩展 recommended_phrases 表
ALTER TABLE recommended_phrases
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('basic', 'advanced'));

-- 2. 更新 essay_type 约束支持 story
ALTER TABLE recommended_phrases
DROP CONSTRAINT IF EXISTS recommended_phrases_essay_type_check;

ALTER TABLE recommended_phrases
ADD CONSTRAINT recommended_phrases_essay_type_check
CHECK (essay_type IN ('email', 'article', 'story', 'general'));

-- 3. 扩展 highlights_library 表
ALTER TABLE highlights_library
ADD COLUMN IF NOT EXISTS knowledge_essay_type TEXT
CHECK (knowledge_essay_type IN ('email', 'article', 'story', 'general'));

-- 4. 插入种子数据（使用 ON CONFLICT 避免重复）
INSERT INTO recommended_phrases (text, type, essay_type, category, level, usage_example, is_active, sort_order)
VALUES
  -- 邮件类 - Opening - Basic
  ('Dear ...', 'phrase', 'email', 'opening', 'basic', 'Dear Sir or Madam,', true, 1),
  -- ... 更多数据
ON CONFLICT DO NOTHING;
```

### 验收检查清单

- [ ] `recommended_phrases` 表有 `category` 字段
- [ ] `recommended_phrases` 表有 `level` 字段
- [ ] `highlights_library` 表有 `knowledge_essay_type` 字段
- [ ] `essay_type` 支持 'story' 值
- [ ] `SELECT count(*) FROM recommended_phrases WHERE category IS NOT NULL` 返回 ≥ 50
- [ ] 种子数据覆盖邮件/文章/故事/通用四类
- [ ] `npm run build` 无错误
- [ ] `npm run lint` 无错误
