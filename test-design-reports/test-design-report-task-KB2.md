## 测试设计报告 - Task KB-2

### 功能概述
更新 TypeScript 类型定义 + DB模块新增 getKnowledgeBase 函数（写入时预关联方案）

主要功能点：
1. 扩展 `RecommendedPhrase` 类型：新增 `category` 和 `level` 字段
2. 扩展 `Highlight` 类型：新增 `knowledge_essay_type` 字段
3. 实现 `getKnowledgeBase(essayType, userId)` 函数 - 获取知识库数据（含系统推荐和用户自定义）
4. 实现 `tryLinkToKnowledgeBase(text, supabaseClient)` 函数 - 写入时预关联知识库
5. 分类标签映射功能

---

### 测试分层策略

| 层次 | 数量 | 覆盖范围 |
|------|------|---------|
| 单元测试 | 18+ | 类型定义、getKnowledgeBase、tryLinkToKnowledgeBase、分类映射 |
| 集成测试 | 4+ | 函数间协作、数据库查询组合 |
| E2E 测试 | 0 | 本次为纯数据层功能，无UI交互，不需要E2E |

---

### 测试用例清单

#### 单元测试 - 类型定义 (UT-TYPE)

| 用例ID | 描述 | 测试内容 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| UT-TYPE-001 | RecommendedPhrase 新增字段类型检查 | category: string \| null, level: 'basic' \| 'advanced' \| null | 类型编译通过 | 高 |
| UT-TYPE-002 | Highlight 新增字段类型检查 | knowledge_essay_type: string \| null | 类型编译通过 | 高 |
| UT-TYPE-003 | 旧数据兼容性 | 不含新字段的数据对象 | 类型兼容（可选字段） | 高 |

#### 单元测试 - getKnowledgeBase() (UT-KB)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-KB-001 | 空结果 - 无系统推荐无用户数据 | essayType='email', 空表 | 返回空数组 [] | 高 |
| UT-KB-002 | 仅系统推荐短语 - 无用户收藏 | 3条email类型系统数据，无highlights | 返回3条，is_collected=false, is_in_highlights=false | 高 |
| UT-KB-003 | 系统短语已收藏（source='system'） | 2条系统数据，1条已收藏到highlights | 对应phrase is_collected=true | 高 |
| UT-KB-004 | 系统短语已在亮点本（source='user'） | 2条系统数据，1条被用户手动添加 | 对应phrase is_in_highlights=true | 高 |
| UT-KB-005 | 混合状态 - 收藏+亮点+未收藏 | 多条数据，不同状态组合 | 各phrase状态正确 | 高 |
| UT-KB-006 | 包含用户自定义条目 | 2条系统数据 + 2条用户自定义 | 返回4条，用户条目追加在后面 | 高 |
| UT-KB-007 | 按分类正确分组 | 多个category的数据 | 按category分组，每组有label | 高 |
| UT-KB-008 | 分类排序正确 | 不同sort_order的数据 | 每组内按sort_order排序 | 高 |
| UT-KB-009 | essay_type='general' 匹配 | essayType='email'，数据有email和general | 同时返回email和general类型 | 高 |
| UT-KB-010 | 分类标签映射正确 | category='opening', 'opinion'等 | label显示为'开篇引入', '观点表达' | 高 |
| UT-KB-011 | 未知分类处理 | category='unknown' | 显示原category或默认label | 中 |
| UT-KB-012 | 数据库查询失败处理 | 模拟DB错误 | 抛出异常，错误信息明确 | 高 |

#### 单元测试 - tryLinkToKnowledgeBase() (UT-LINK)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-LINK-001 | 精确匹配找到 | text='I am writing to...'，存在匹配 | 返回phrase.id | 高 |
| UT-LINK-002 | 无匹配 | text='not exist text' | 返回null | 高 |
| UT-LINK-003 | 大小写敏感匹配 | text='i am writing to...' vs 'I am writing to...' | 根据实现决定（需明确） | 高 |
| UT-LINK-004 | 空白字符处理 | text='  I am writing to...  ' | 返回null或trim后匹配 | 中 |
| UT-LINK-005 | 多条匹配取第一条 | 多条相同text | 返回第一条的id | 中 |
| UT-LINK-006 | 空字符串输入 | text='' | 返回null | 中 |
| UT-LINK-007 | 数据库错误处理 | 模拟DB错误 | 抛出异常 | 高 |

#### 单元测试 - 分类标签映射 (UT-CAT)

| 用例ID | 描述 | 输入 | 预期结果 | 优先级 |
|--------|------|------|---------|--------|
| UT-CAT-001 | 所有预定义分类映射 | 12个category值 | 映射到正确中文label | 高 |
| UT-CAT-002 | 分类映射函数独立测试 | getCategoryLabel(category) | 返回正确label | 中 |

#### 集成测试 (IT)

| 用例ID | 描述 | 测试内容 | 预期结果 | 优先级 |
|--------|------|---------|---------|--------|
| IT-001 | tryLinkToKnowledgeBase 结果用于 createHighlights | 先link获取id，再创建highlight | highlight包含recommended_phrase_id | 高 |
| IT-002 | getKnowledgeBase 显示 tryLinkToKnowledgeBase 关联的数据 | 通过link关联的数据 | is_collected 或 is_in_highlights 正确 | 高 |
| IT-003 | 完整流程 - 写入时预关联 | 创建highlight → link → 查询知识库 | 数据一致性正确 | 高 |
| IT-004 | 并发场景 - 同时写入和查询 | 模拟并发 | 无竞态条件 | 中 |

---

### Mock 数据结构推荐

#### 1. RecommendedPhrase Mock
```typescript
const mockRecommendedPhrases = [
  {
    id: 'phrase-1',
    text: 'I am writing to inquire about...',
    type: 'phrase',
    essay_type: 'email',
    category: 'opening',
    level: 'basic',
    topic_tags: ['formal', 'inquiry'],
    usage_example: 'I am writing to inquire about the job position.',
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'phrase-2',
    text: 'I would like to express my opinion that...',
    type: 'sentence',
    essay_type: 'email',
    category: 'opinion',
    level: 'advanced',
    topic_tags: ['formal', 'opinion'],
    usage_example: 'I would like to express my opinion that this is a good idea.',
    is_active: true,
    sort_order: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'phrase-3',
    text: 'In conclusion',
    type: 'phrase',
    essay_type: 'general',  // general类型
    category: 'closing',
    level: 'basic',
    topic_tags: ['writing'],
    usage_example: 'In conclusion, I believe that...',
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'phrase-4',
    text: 'Furthermore',
    type: 'vocabulary',
    essay_type: 'article',
    category: 'connector',
    level: null,  // 测试null level
    topic_tags: ['transition'],
    usage_example: 'Furthermore, we need to consider...',
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
];
```

#### 2. Highlight Mock (用户收藏/亮点)
```typescript
const mockHighlights = [
  // 系统推荐已收藏（从推荐页点击收藏）
  {
    id: 'highlight-1',
    user_id: 'user-123',
    text: 'I am writing to inquire about...',
    type: 'phrase',
    source: 'system',
    recommended_phrase_id: 'phrase-1',
    source_submission_id: null,
    knowledge_essay_type: 'email',  // 新增字段
    created_at: '2024-01-15T00:00:00Z',
  },
  // 用户自定义亮点（从批改页添加）
  {
    id: 'highlight-2',
    user_id: 'user-123',
    text: 'This is a user custom phrase',
    type: 'phrase',
    source: 'user',
    recommended_phrase_id: null,
    source_submission_id: 'sub-123',
    knowledge_essay_type: 'email',
    created_at: '2024-01-16T00:00:00Z',
  },
  // 系统推荐已在亮点本（从批改页添加，通过tryLink关联）
  {
    id: 'highlight-3',
    user_id: 'user-123',
    text: 'In conclusion',
    type: 'phrase',
    source: 'user',  // 注意：虽然关联了phrase，但source是user
    recommended_phrase_id: 'phrase-3',
    source_submission_id: 'sub-456',
    knowledge_essay_type: 'article',
    created_at: '2024-01-17T00:00:00Z',
  },
];
```

#### 3. Supabase Client Mock
```typescript
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  single: jest.fn(),
};
```

---

### 边缘情况考虑

1. **数据一致性**
   - highlights 中 recommended_phrase_id 指向不存在的 phrase
   - highlights 中 source='system' 但 recommended_phrase_id 为 null
   - highlights 中 source='user' 但 recommended_phrase_id 有值

2. **分类处理**
   - category 为 null 的数据
   - category 不在预定义映射中的数据
   - 所有数据都是同一 category
   - 所有数据 category 都不同

3. **排序**
   - sort_order 相同的数据
   - sort_order 为 null 的数据
   - 负数 sort_order

4. **essay_type 匹配**
   - essayType 参数为 null
   - essayType 参数为不在枚举中的值
   - 同时匹配 specific type 和 general 的数据去重

5. **性能**
   - 大量数据时的查询性能（1000+ phrases）
   - 用户有大量 highlights 时的性能

---

### 已创建的测试文件

建议创建以下测试文件：

1. `/src/types/database.test.ts` - 类型定义测试（可选，TypeScript编译即验证）
2. `/src/lib/db/recommended-phrases.test.ts` - getKnowledgeBase 函数测试
3. `/src/lib/db/highlights.test.ts` - tryLinkToKnowledgeBase 函数测试（添加到现有文件或新建）

---

### 给主 Agent 的建议

1. **类型定义**：确保新字段都是可选的（`| null`），保持向后兼容
2. **getKnowledgeBase 实现细节**：
   - 使用 Map 进行 O(1) 查找，避免 ILIKE
   - 正确处理 source='system' vs source='user' 的区别
   - 用户自定义条目需要匹配 knowledge_essay_type
3. **tryLinkToKnowledgeBase 实现细节**：
   - 明确是否区分大小写（建议不区分，使用 ilike）
   - 是否 trim 输入（建议 trim）
4. **测试建议**：
   - 先写测试，再实现功能（TDD）
   - 使用 jest.mock 模拟 Supabase 客户端
   - 参考已有的 writing-guide.test.ts 和 corrections.test.ts 的 mock 模式
5. **数据完整性**：
   - 考虑在 highlights 表上添加外键约束（如果尚未有）
   - 考虑为 recommended_phrases.text 添加索引以优化 tryLink 查询

---

### 测试执行命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npx jest src/lib/db/recommended-phrases.test.ts
npx jest src/lib/db/highlights.test.ts

# 带覆盖率
npm test -- --coverage
```
