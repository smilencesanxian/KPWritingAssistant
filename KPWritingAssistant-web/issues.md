# 问题记录与修复历史

## Issue 1: 字帖生成系统重构

### 问题描述
原有字帖生成系统不符合 PET 标准答题纸格式，需要支持模板系统和多种模式。

### 解决方案
- 新建模板系统（`src/lib/pdf/templates/`）
  - `CopybookTemplate` 接口定义页面布局、行数、装饰元素等
  - PET 模板：170mm答题区、18行/页、11.2mm行高、四角定位标记、Cambridge English水印、Examiner评分表、条形码
  - 模板注册表支持后续扩展 KET 等格式
- 新建统一渲染引擎（`renderer.ts`）：按模板配置渲染 PDF
- 新增 `CopybookMode`：'tracing'（临摹，显示范文）/ 'dictation'（默写，空白行）
- 数据库迁移：`copybooks` 表新增 `template_id`、`mode` 列

### 相关文件
- `src/lib/pdf/templates/pet.ts`
- `src/lib/pdf/templates/index.ts`
- `src/lib/pdf/renderer.ts`
- `src/lib/pdf/copybook.ts`
- `supabase/migrations/002_copybook_template_mode.sql`

### 状态
✅ 已完成（Commit: 743e629）

---

## Issue 2: 首页最近批改记录 404

### 问题描述
首页点击已生成的最近批改记录，跳转过去的页面显示404。但点击查看全部历史记录进去后，再点击最近批改记录可以正常跳转。

### 根因分析
- `getRecentSubmissions` 只查询 `essay_submissions` 表，没有关联 `corrections` 表
- `Submission` 类型没有 `correction_id` 字段
- `RecentSubmissionItem` 链接错误地使用了 `submission.id` 而非 `correction.id`
- 历史记录页面通过 `SubmissionWithScore` 类型正确获取了 `correction_id`

### 解决方案
- `getRecentSubmissions` 加入 `corrections` 关联查询获取 `correction_id`
- 返回类型改为 `SubmissionWithScore[]`
- `RecentSubmissionItem` 链接从 `submission.id` 改为 `correction_id`
- `DashboardClient` 更新类型导入

### 相关文件
- `src/lib/db/stats.ts`
- `src/components/home/DashboardClient.tsx`
- `src/components/home/RecentSubmissionItem.tsx`

### 状态
✅ 已完成（Commit: 405c104）

---

## Issue 3: 范文视图优化

### 问题描述
1. 生成字帖的范文后要展示范文总字数
2. 字帖中不需要展示总字数
3. 生成字帖的范文只给一个卓越范文就可以，普通和优秀的先去掉
4. 默认展示卓越范文，不需要用户再点击一次

### 解决方案
- 移除 `LevelSelector` 组件，只保留卓越范文
- 组件 mount 时自动请求 `excellent` 级别范文
- 新增 `countWords` 函数计算词数
- 范文下方显示 "共 X 词"（PDF 中不显示字数）
- 标题从 "范文" 改为 "卓越范文"

### 相关文件
- `src/components/correction/ModelEssayView.tsx`

### 状态
✅ 已完成（Commit: 405c104）

---

## Issue 4: PDF 字帖多字体支持

### 问题描述
默认支持的字体只有一个（Gochi Hand）太少了，需要 2-3 个免费的默认字体供用户选择，不要全部都是手写字体。

### 解决方案
- 新增字体选项：
  - `gochi-hand`: Gochi Hand（手写体）
  - `courier`: Courier（等宽体，打字机风格）
  - `times`: Times Roman（衬线体，经典印刷）
  - `helvetica`: Helvetica（无衬线体，简洁现代）
- `renderer.ts` 新增 `resolveFontName` 函数映射字体 ID 到 PDFKit 字体名
- `ModelEssayView` 新增字体选择器 UI
- API、DB 层、缓存 key 同步更新支持 `font_style` 参数

### 相关文件
- `src/lib/pdf/renderer.ts`
- `src/lib/pdf/copybook.ts`
- `src/app/api/generate/copybook/route.ts`
- `src/lib/db/copybooks.ts`
- `src/components/correction/ModelEssayView.tsx`

### 状态
✅ 已完成（Commit: 405c104）

---

## Issue 5: PDF 字帖留白优化

### 问题描述
最后生成的 PDF 字帖展示效果需要优化，当前每一行后面都有很大的留白，很难看。比如一行正常能写 50 个字母，但是实际上每一行只有 30 个左右的字母。

### 根因分析
- 原代码使用固定字符数估算（`maxCharsPerLine = 48`）进行换行
- Gochi Hand 字体字符宽度不一，估算不准确
- 没有考虑实际字体 metrics

### 解决方案
- 使用 PDFKit 的 `widthOfString()` 精确计算文本实际宽度
- 新增 `wrapTextWithFontMetrics` 函数，基于实际字体 metrics 换行
- 最大化每行填充率，减少尾部留白
- 将段落换行符转换为空格，使文本连续填充

### 相关文件
- `src/lib/pdf/renderer.ts`

### 状态
✅ 已完成（Commit: 405c104）

---

## Issue 6: 字帖预览页"返回批改结果"404

### 问题描述
字帖预览页面点击"返回批改结果"按钮报 404。

### 根因分析
`/app/copybook/[id]/page.tsx` 的返回链接硬编码为 `/corrections`，但该路由不存在，只有 `/corrections/[id]`。

### 解决方案
- 更新 `getCopybookById` 查询，通过 `model_essays(correction_id)` 联表取回 correction_id
- 新增 `CopybookWithCorrectionId` 类型（扩展 `Copybook`，包含关联的 `model_essays.correction_id`）
- 返回链接改为 `/corrections/${correctionId}`，若 correctionId 为空则 fallback 到 `/history`

### 相关文件
- `src/lib/db/copybooks.ts`
- `src/app/copybook/[id]/page.tsx`

### 状态
✅ 已完成（2026-03-21）

---

## Issue 7: 全站路由 404 审计

### 问题描述
多次出现点击链接跳转 404 的问题，需要举一反三审计所有导航链接。

### 审计结果
对 `src/` 下所有 `href=`、`router.push()`、`redirect()` 进行完整扫描，已确认路由状态：

| 路由 | 状态 |
|------|------|
| `/` | ✅ 存在 |
| `/login` | ✅ 存在 |
| `/register` | ✅ 存在 |
| `/upload` | ✅ 存在 |
| `/history` | ✅ 存在 |
| `/highlights` | ✅ 存在 |
| `/error-points` | ✅ 存在 |
| `/error-points/[id]` | ✅ 存在 |
| `/corrections/[id]` | ✅ 存在 |
| `/copybook/[id]` | ✅ 存在 |
| `/profile` | ✅ 存在 |
| `/corrections`（无 id） | ❌ 不存在（已在 Issue 6 修复） |

### 状态
✅ 已完成（2026-03-21）

---

## Issue 8: 重启开发服务器报 EADDRINUSE

### 问题描述
使用 `rm -rf .next/dev && npm run dev -- --port 3001` 重启后端服务时，偶发报错：
```
Error: listen EADDRINUSE: address already in use :::3001
```

### 根因分析
`rm -rf .next/dev` 只删除构建缓存文件，不会终止仍在监听端口的 Node.js 进程。重启时旧进程还占着端口，新进程绑定同一端口就报错。

### 解决方案
- `init.sh` 启动 dev server 前，先用 `lsof -ti:<port> | xargs kill -9` 杀死占用端口的进程
- 手动重启命令统一改为：
  ```bash
  fuser -k 3001/tcp 2>/dev/null; sleep 1; rm -rf .next/dev && npm run dev -- --port 3001
  ```

### 相关文件
- `init.sh`

### 状态
✅ 已完成（2026-03-21）

---

## Issue 9: WSL 环境下 lsof 无法找到 Node.js 进程

### 问题描述
执行 `lsof -ti:3001 | xargs kill -9 2>/dev/null; rm -rf .next/dev && npm run dev -- --port 3001` 后仍然报错：
```
Error: listen EADDRINUSE: address already in use :::3001
```

### 根因分析
`lsof` 在 WSL 内核下无法枚举 Node.js 进程，返回空值，导致 `xargs kill` 实际什么也没执行，旧进程继续占用端口。`fuser` 直接查询内核 TCP socket 表，在 WSL 下可以正常工作。

验证方式：
```bash
ss -tlnp | grep 3001     # 能找到进程
fuser 3001/tcp           # 能找到 PID
lsof -ti:3001            # 返回空（WSL 下失效）
```

### 解决方案
- `init.sh` 将 `lsof` 改为 `fuser` 检测并杀进程
- 手动重启命令统一改为：
  ```bash
  fuser -k 3001/tcp 2>/dev/null; sleep 1; rm -rf .next/dev && npm run dev -- --port 3001
  ```

### 相关文件
- `init.sh`
- `issues.md`（更新重启命令说明）

### 状态
✅ 已完成（2026-03-22）

---

## Issue 10: MaShanZheng 字体报错 500

### 问题描述
选择马善政楷书（ma-shan-zheng）等免费手写体生成字帖时，API 返回 500 错误。

### 根因分析
字体文件 `MaShanZheng-Regular.ttf` 被截断（1.9MB，实际应为 5.7MB）。
- `glyf` 表声称长度 5.6MB，但文件在 1.9MB 处截止
- Glyph 2418（汉字"族"，Unicode 26063）的偏移量超出文件末尾
- `fontkit` 处理 GPOS 表时触发该 glyph，抛出 `RangeError: Offset is outside the bounds of the DataView`
- `pdfkit` 内部调用 `widthOfString` 时触发 GPOS 处理，导致 500

### 解决方案
1. **字体文件修复**：后台重新从 Google Fonts 完整下载字体文件（5.7MB）替换截断版本
2. **防御性 fallback**：`renderer.ts` 在使用字体前，先以较长测试字符串调用 `widthOfString` 做兼容性检测；若失败自动降级到 GochiHand，避免 500

### 相关文件
- `src/assets/fonts/MaShanZheng-Regular.ttf`（需重新下载完整版）
- `src/lib/pdf/renderer.ts`（新增 fallback 逻辑）

### 状态
⚠️ 部分修复（fallback 逻辑已上线，字体文件仍需完整下载后完全恢复）

---

## Issue 11: 临摹模式 PDF 字体灰化

### 问题描述
临摹模式生成的 PDF 中，范文文字是纯黑色，临摹时视觉干扰较大，希望字体能灰化以便学生描摹。

### 解决方案
- `renderer.ts` 新增 `opacityToTracingColor(opacity)` 函数，将透明度（0-100）转换为灰色 hex 颜色
- `renderCopybookPDF` 新增 `tracingOpacity` 参数（默认 30%）
- 临摹模式下文字颜色由 `#1a1a1a` 改为根据 opacity 计算的灰色
- API `route.ts` 接收 `tracing_opacity` 参数，并编码进缓存 key（`fontStyle@opacity`）避免不同灰度命中旧缓存
- `ModelEssayView.tsx` 在临摹模式下显示灰度调节滑块（10%-80%，默认 30%）

### 相关文件
- `src/lib/pdf/renderer.ts`
- `src/lib/pdf/copybook.ts`
- `src/app/api/generate/copybook/route.ts`
- `src/components/correction/ModelEssayView.tsx`

### 状态
✅ 已完成（2026-03-22）

---

## Issue 12: PET 评分满分显示不符

### 问题描述
UI 显示满分 30 分，但 AI prompt 中每维度是 0-5 分（总分 0-15 分），导致生成的卓越范文批改后只得 15 分（实际是满分但显示为 15/30）。

### 根因分析
PET 考试两篇写作合计 30 分（每篇 15 分），UI 正确显示总分 30 分，但 prompt 配置错误地将单篇评分设为 0-5/维度。

### 解决方案
`prompts.json` 中 `correction.systemPrompt` 的评分标准从每维度 0-5（总分 0-15）改为每维度 0-10（总分 0-30），并细化每个分段的描述性说明。

### 相关文件
- `src/config/prompts.json`

### 状态
✅ 已完成（2026-03-22）

---

## 待办事项

### 数据库迁移
⚠️ **必需**：执行以下 SQL 添加新列

```sql
-- 添加 template_id 和 mode 列（如果尚未执行）
ALTER TABLE copybooks
  ADD COLUMN IF NOT EXISTS template_id TEXT NOT NULL DEFAULT 'pet',
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'tracing';

-- 添加 font_style 列
ALTER TABLE copybooks
  ADD COLUMN IF NOT EXISTS font_style TEXT NOT NULL DEFAULT 'gochi-hand';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_copybooks_template_mode
  ON copybooks (model_essay_id, user_id, template_id, mode);
```

### 已知限制
- WSL + Windows 磁盘环境可能导致 Turbopack 热更新失效
- 如遇修改不生效，需手动重启 dev server（先杀进程再清缓存）：
  ```bash
  fuser -k 3001/tcp 2>/dev/null; sleep 1; rm -rf .next/dev && npm run dev -- --port 3001
  ```
