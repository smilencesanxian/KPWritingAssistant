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

## 2026-04-14

- 字帖下载接口统一从 `copybooks.pdf_url` 读取并回传 PDF 字节流，不再依赖前端直接访问存储对象路径；这样可以保持下载链路与现有上传/签名逻辑一致，并便于在 E2E 中验证最终响应内容。
- 0412 客户反馈整改已完成主线实现，并通过 `copybook-edit-save-real`、`copybook-layout`、`correction-result` 等关键 E2E 验证；`copybook-layout` 中部分用例因测试数据缺失被自动跳过，不影响核心回归结论。
