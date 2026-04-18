# 当前状态

最后更新：2026-04-18

## 项目快照

- 仓库根目录：`/mnt/d/ClaudeCodes/KPWritingAssistant-github/KPWritingAssistant`
- 当前主开发应用：`KPWritingAssistant-web/`
- 主要技术栈：Next.js 16.2.0、React 19、TypeScript、Supabase、Jest、Playwright、pdfkit
- handoff 机制落地前的备份检查点：
  - Commit：`f3df323`
  - Tag：`backup-before-handoff-20260407-195102`

## 当前事实

- `KPWritingAssistant-web/` 是当前真实的生产主代码库，默认后续开发都从这里继续。
- `apps/web`、`apps/miniapp`、`packages/api-client`、`packages/types` 目前默认视为迁移或实验产物，除非后续 handoff 明确提升为正式入口。
- `task-v1.2.0.json` 目前只保留历史追踪意义。截止 2026-04-07，其中 41 个任务都已标记为 `passes: true`。
- 已新增 `docs/harness-engineering/development-spec.md` 作为 Harness Engineering 的仓库级执行基线；后续 agent 会话需先读取该文件，再执行开发任务。

## 已验证基线

以下命令已于 2026-04-07 在 `KPWritingAssistant-web/` 中验证：

```bash
npm test -- --runInBand
npm run lint
npm run build
```

当时结果如下：

- `npm test -- --runInBand`：20 个 suite、274 个测试全部通过
- `npm run build`：通过
- `npm run lint`：通过，0 error，14 个 warning

## 已知风险

- `run-automation.sh` 中仍然存在硬编码 API Key，后续如果继续依赖该脚本，需要先清理并轮换密钥。
- 当前 lint 还不算完全干净，现有 warning 主要是测试文件和少量源码中的未使用变量。
- `KPWritingAssistant-web/progress.txt` 仍有参考价值，但最近的 git 提交比它更能反映当前真实进展。
- `recommended_phrases.essay_type` 的代码类型已补齐 `story`，与 008 migration 的数据库约束保持一致，后续新增知识库素材时应继续沿用该枚举。
- `model_essays.source_spans` 已新增为 JSONB 元数据列，用于承载范文来源高亮的结构化 spans；编辑保存会清空该列，重新生成会重建。
- 0412 客户反馈整改已完成到可验证状态，最近一轮关键 E2E 已通过：
  - `e2e/copybook-edit-save-real.spec.ts`
  - `e2e/copybook-layout.spec.ts`
  - `e2e/correction-result.spec.ts`
  - 其中 `copybook-layout` 的部分用例因测试数据缺失被自动 skip，不影响已覆盖的关键路径结论。

## 新增基线评测

- 新增 `KPWritingAssistant-web/e2e/ocr-accuracy.spec.ts`，默认跳过，只有手动设置 `RUN_OCR_ACCURACY=1` 才会运行。
- 新增 `KPWritingAssistant-web/e2e/ocr-accuracy.baseline.json`，作为当前版本的 OCR 准确率 baseline。
- 新增 `KPWritingAssistant-web/scripts/run-ocr-accuracy.mjs` 与 `npm run ocr:accuracy`，运行时会自动读取 `.env.local`。
- 当前实测结果：
  - `tencent` 在 `ket` / `pet` 两张样本上的平均准确率为 `94.8%`
  - `tal` 在 `ket` / `pet` 两张样本上的平均准确率为 `94.8%`
  - `baidu` 因当前 `.env.local` 未配置密钥而跳过
- benchmark 预处理与线上上传页保持一致，先把图片压到 `1920` 上限再送 OCR，避免把超大原图误判成识别劣化。
- OCR 文本清理现在额外会过滤独立的大写短噪音 token，例如尾部单独出现的 `IGV`，避免这类 OCR 杂字符直接暴露给用户。
- 范文生成的字数门槛已调整为 `90-120` 词，目标仍优先 `100-110` 词；重试次数通过 `MODEL_ESSAY_MAX_ATTEMPTS` 控制，默认 3 次，超过后直接返回最后一次结果，不再向用户暴露“字数约束失败”文案。
- 范文生成提示词已回收为 `100-110` 词左右，真正的后置验收放宽到 `90-120` 词，以避免模型在提示词阶段被过度放宽。

## 线上部署状态

- 已将当前最新代码部署到服务器 `8.136.127.32` 的 `/var/www/kp-writing/KPWritingAssistant-web`
- 已在服务器目录内执行 `set -a && . ./.env.production && set +a && docker compose up -d --build`
- 当前容器 `kpwritingassistant-web-app-1` 运行正常，`127.0.0.1:3000` 返回 `200`

## 文档语言约定

- 当前目录下的 handoff 文档默认使用中文维护。
- 状态值、命令、路径、代码标识和必要术语可以保留英文。

## 会话开始检查清单

1. 阅读本文件、`active-task.md` 和 `decision-log.md`。
2. 执行 `git status --short --branch`。
3. 用 `git log --oneline --decorate -n 10` 查看最近历史。
4. 如果要继续 web 端开发，默认在 `KPWritingAssistant-web/` 下进行，除非 handoff 明确说明不是。

## 会话结束检查清单

1. 更新 `active-task.md`。
2. 如果基线、开发入口或主要风险变化了，同步更新本文件。
3. 如果形成了长期有效的新约定，追加到 `decision-log.md`。
