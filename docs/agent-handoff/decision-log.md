# 决策记录

## 2026-04-07

- 跨 agent 的共享上下文统一存放在 `docs/agent-handoff/`，并作为跨会话连续开发的仓库级事实来源。
- 当前主生产代码库是 `KPWritingAssistant-web/`。
- `apps/` 和 `packages/` 现阶段不是默认开发目标。
- `task-v1.2.0.json` 不再作为默认的当前任务选择来源，因为其中任务都已完成。
- 每次 agent 会话开始前都要读取 `current-state.md`、`active-task.md`、`decision-log.md`，结束前都要更新。
- 后续新增或更新的交接文档默认使用中文，只有在术语、命令、路径、状态枚举值或外部规范需要时才保留英文。
- 线上 Web 服务当前部署目录为服务器 `8.136.127.32` 的 `/var/www/kp-writing/KPWritingAssistant-web`，通过该目录下的 Docker Compose 原地重建并继续复用 `3000` 端口，不新开额外端口。
- 线上部署执行 `docker compose` 前，先在该目录运行 `set -a && . ./.env.production && set +a` 导出环境变量；否则 compose 会按空值解析构建参数和运行时变量。

## 2026-04-13

- 好未来 OCR 的 HTTP/HTTPS 鉴权在接入层必须把 `request_body` 当作一个签名参数，与 `access_key_id`、业务 URL 参数、`signature_nonce`、`timestamp` 一起按 key 升序拼接后做 `HmacSHA1(access_key_secret + "&")`；最终 `signature` 必须 URL 编码后再拼进 query string。
- 好未来 OCR 返回的 `hand_text` / `print_text` 数组顺序不能直接当作阅读顺序使用，接入层需要按坐标恢复从上到下、从左到右的文本顺序后再输出。
- OCR 准确率基准测试统一放在 `KPWritingAssistant-web/e2e/ocr-accuracy.spec.ts`，默认跳过，只有 `RUN_OCR_ACCURACY=1` 才会运行；发布前可直接用 `npm run ocr:accuracy` 门禁。
- 基准测试必须先按上传页同样的压缩逻辑把图片限制到 `1920` 上限，再送入 OCR，以保证 benchmark 与线上输入一致。
- 当前 baseline 固化在 `KPWritingAssistant-web/e2e/ocr-accuracy.baseline.json`，阈值为：准确率低于 `90%` 或比 baseline 下降超过 `5%` 时直接告警/失败。
- `recommended_phrases.essay_type` 与知识库分类在代码层必须显式支持 `story`，以便 Part2 故事题能直接命中相应素材池，而不是退化到仅 `article/general`。
- `ErrorPointCard` 的默认浏览态不再暴露删除入口，删除动作只保留在 `manageMode` 内。
- 范文正文词数统计统一按结构化解析结果计算，Part1 的称呼/落款和 Part2 文章标题不计入正文词数。
- `model_essays` 现在增加 `source_spans JSONB` 列，范文来源高亮以结构化 spans 保存；手动编辑会清空来源标注，重新生成会重新计算。
- OCR 结果在返回给前端前会先做噪音过滤，再做轻量版式恢复，优先保留标题、称呼、正文和落款的块级结构。
- OCR 尾部如果出现独立的大写短噪音 token，例如 `IGV` 这类 2-4 字母的孤立块，会在清理和版式恢复阶段一起去掉；这个规则只针对独立整行噪音，不应扩展到正文内联单词。
- 范文生成的校验口径统一为“目标 100-110 词，允许 90-130 词”，Part 1 不计称呼和落款，Part 2 Article 不计标题，Part 2 Story 全文计词；生成失败时最多重试 `MODEL_ESSAY_MAX_ATTEMPTS` 次，默认 3 次，之后直接返回最后一次结果，不再对用户展示“字数约束未满足”的报错。
- 范文生成提示词只保留 `100-110` 词左右的目标要求，不把 `90-130` 词扩散到模型提示词中；`90-130` 仅作为服务端后置验收口径使用。

## 2026-04-14

- 字帖下载接口统一从 `copybooks.pdf_url` 读取并回传 PDF 字节流，不再依赖前端直接访问存储对象路径；这样可以保持下载链路与现有上传/签名逻辑一致，并便于在 E2E 中验证最终响应内容。
- 0412 客户反馈整改已完成主线实现，并通过 `copybook-edit-save-real`、`copybook-layout`、`correction-result` 等关键 E2E 验证；`copybook-layout` 中部分用例因测试数据缺失被自动跳过，不影响核心回归结论。

## 2026-04-18

- 仓库正式引入 Harness Engineering 作为默认开发流程，规范基线文件为 `docs/harness-engineering/development-spec.md`。
- 会话启动阅读顺序调整为：Harness 规范 → handoff 三件套 → `CLAUDE.md`；`KPWritingAssistant-web/` 内开发同样遵循该顺序。
- 根 `AGENTS.md` 明确保持“地图而非手册”定位，只保留入口与硬约束，详细规范沉淀到专用文档。
- 新增统一机械门禁要求：非纯文档任务默认执行 `npm run lint`、`npm test`、`npm run build`；门禁失败不得标记任务完成。
- 范文正文硬上限从 `130` 收紧到 `120`；服务端编辑保存、前端计数提示、生成重试校验统一沿用同一口径（目标 `100-110`，允许 `90-120`）。
- 范文生成结果在进入后续流程前统一做结构化归一化：收紧 Part2 标题识别，避免把长句误判成标题导致词数偏低；超长单段正文会按句子自动拆分为多段，提升可读性与字帖布局稳定性。
- 批改结果页不再展示“上传原图”区域，也不再单独展示“改进建议”卡片；保留 Step 6 作为总结与建议主入口。
- 知识库 `article` 标签页改为优先按 `topic_tags` 主题分组展示，并过滤系统 `level='basic'` 素材；主题顺序对齐 `PET写作知识库-v2.0.md`（地点描述、困难事物、人际友谊、居住环境、敬佩的人、兴趣爱好、读书）。
- 浏览器回归（MCP Playwright + `npm run test:e2e`）依赖可执行 Chrome；本项目统一以 `/opt/google/chrome/chrome` 为预检路径，缺失时先执行 `npx playwright install chrome` 再回归，避免“浏览器未安装导致 E2E 未执行”的假阴性。

## 2026-04-19

- `recommended_phrases` 的 article `topic_tags` 治理采用“先审计再回填”的固定流程：先统计填充率与主题命中，再执行幂等回填脚本，最后用 API 断言验证分组效果。
- 新增可执行回填入口 `npm run kb:backfill:article-topics`，脚本位于 `KPWritingAssistant-web/scripts/backfill-article-topic-tags.mjs`，默认从 `.env.local` 读取 `SUPABASE_SERVICE_ROLE_KEY` 并直接回写数据库。
- 同步新增 `KPWritingAssistant-web/supabase/migrations/012_backfill_article_topic_tags.sql` 作为 SQL 版回填基线，确保不同环境可复用同一策略。

## 2026-04-26

- `KPWritingAssistant-web/src/lib/db/knowledge-base.ts` 的 `kb_sections` 查询必须显式包含 `category_slug`，否则生产构建会在 TypeScript 阶段失败。
- 服务器线上代码已更新到 `1b796ae`，并通过 `set -a && . ./.env.production && set +a && docker compose up -d --build --force-recreate` 重新构建和启动，端口 `3000` 验证通过。
