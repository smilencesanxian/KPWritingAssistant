# KP作文宝 (KPWritingAssistant)

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js" alt="Next.js 16+">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4.0+-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Supabase-Postgres-green?style=flat-square&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License">
</p>

<p align="center">
  <b>面向PET备考家庭的 AI写作教练 + 智能字帖生成器 + 个性化错题本</b>
</p>

## 项目简介

KP作文宝是一款专为PET（Preliminary English Test）备考学生设计的AI写作辅助工具。通过**批改-积累-练习**的闭环，帮助孩子提升写作能力和卷面分。

### 核心流程

```
拍照上传手写作文 → OCR识别 → AI批改评分 → 亮点提取 → 范文生成 → 字帖PDF下载
                                    ↓
                              自动追踪反复错误
                                    ↓
                              形成个性化易错点档案
```

## 功能特性

### 已完成功能

| 模块 | 功能描述 | 状态 |
|-----|---------|------|
| **用户系统** | 邮箱/密码注册登录、JWT Session 管理 | ✅ |
| **作文上传** | 拍照/图片上传、多OCR提供商支持 | ✅ |
| **AI批改** | PET标准4维度评分、错误标注、智能评语 | ✅ |
| **亮点库** | 自动提取好词好句、支持手动添加、搜索筛选 | ✅ |
| **易错点追踪** | 自动归类错误类型、重复错误标记、历史记录 | ✅ |
| **范文生成** | 三级范文（合格/优秀/卓越）、保留个人亮点 | ✅ |
| **字帖生成** | PET答题卡格式PDF、A4自动分页、下载打印 | ✅ |
| **响应式设计** | 支持桌面端和移动端访问 | ✅ |

### 技术亮点

- **多提供商支持**：OCR支持百度/腾讯/Claude；LLM支持任意OpenAI-compatible API
- **智能错误追踪**：同一错误类型出现≥2次自动标记为易错点
- **PET标准评分**：严格遵循PET作文评分标准（内容/沟通/语言/组织）
- **字帖仿真**：模拟PET答题卡横线格式，支持打印练习

## 技术栈

| 层级 | 技术选型 |
|-----|---------|
| **前端框架** | Next.js 16+ (App Router) + React 19 |
| **开发语言** | TypeScript 5+ (Strict Mode) |
| **样式方案** | Tailwind CSS v4 |
| **后端服务** | Next.js API Routes |
| **数据库** | Supabase (PostgreSQL) |
| **认证授权** | Supabase Auth |
| **文件存储** | Supabase Storage |
| **AI/LLM** | OpenAI-compatible API（默认：阿里云DashScope通义千问） |
| **OCR** | 百度OCR / 腾讯云OCR / Claude Vision |
| **PDF生成** | pdfkit |
| **测试** | Playwright E2E |

## 项目结构

```
KPWritingAssistant-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── correct/        # AI批改接口
│   │   │   ├── essays/         # 作文CRUD
│   │   │   ├── error-points/   # 易错点接口
│   │   │   ├── generate/       # 范文/字帖生成
│   │   │   ├── highlights/     # 亮点库接口
│   │   │   ├── ocr/            # OCR识别接口
│   │   │   ├── stats/          # 统计数据
│   │   │   └── upload/         # 文件上传
│   │   ├── copybook/[id]/      # 字帖预览页
│   │   ├── corrections/[id]/   # 批改结果页
│   │   ├── error-points/       # 易错点列表/详情
│   │   ├── highlights/         # 亮点库页面
│   │   ├── history/            # 历史记录
│   │   ├── login/              # 登录页
│   │   ├── register/           # 注册页
│   │   ├── upload/             # 作文上传页
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 首页
│   ├── components/             # React组件
│   │   ├── auth/               # 认证相关
│   │   ├── correction/         # 批改结果展示
│   │   ├── error/              # 易错点组件
│   │   ├── highlights/         # 亮点库组件
│   │   ├── home/               # 首页组件
│   │   ├── layout/             # 布局组件
│   │   ├── ui/                 # 通用UI组件
│   │   └── upload/             # 上传组件
│   ├── lib/                    # 工具库
│   │   ├── ai/                 # LLM集成
│   │   ├── db/                 # 数据库操作
│   │   ├── ocr/                # OCR集成
│   │   ├── pdf/                # PDF生成
│   │   └── supabase/           # Supabase客户端
│   ├── types/                  # TypeScript类型定义
│   └── assets/                 # 静态资源（字体等）
├── supabase/
│   └── migrations/             # 数据库迁移文件
├── .env.local.example          # 环境变量模板
├── package.json
└── next.config.js
```

## 快速开始

### 前置要求

- Node.js 18+
- npm / yarn / pnpm
- Supabase 项目（[免费创建](https://supabase.com/)）
- OCR服务账号（百度/腾讯/Claude任选其一）
- LLM API Key（DashScope/Kimi/OpenAI等）

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd KPWritingAssistant-web
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

```bash
cp .env.local.example .env.local
# 编辑 .env.local 填写你的配置
```

4. **初始化数据库**

在Supabase SQL Editor中执行 `supabase/migrations/001_initial_schema.sql`

5. **启动开发服务器**

```bash
npm run dev
```

访问 http://localhost:3000

## 环境变量配置

| 变量名 | 必填 | 说明 |
|-------|------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase项目URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase匿名密钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase服务角色密钥 |
| `LLM_API_KEY` | ✅ | LLM API密钥 |
| `LLM_BASE_URL` | ❌ | LLM API基础URL（默认：DashScope） |
| `LLM_MODEL` | ❌ | 模型名称（默认：qwen-plus） |
| `OCR_PROVIDER` | ❌ | OCR提供商：baidu/tencent/claude |
| `BAIDU_OCR_API_KEY` | 条件 | 百度OCR API Key |
| `BAIDU_OCR_SECRET_KEY` | 条件 | 百度OCR Secret Key |
| `TENCENT_SECRET_ID` | 条件 | 腾讯云SecretId |
| `TENCENT_SECRET_KEY` | 条件 | 腾讯云SecretKey |
| `ANTHROPIC_API_KEY` | 条件 | Claude API Key |

> **注意**：根据`OCR_PROVIDER`选择，仅需配置对应OCR服务商的密钥

## 可用的脚本

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 生产启动
npm start

# 代码检查
npm run lint

# E2E测试
npm run test:e2e

# E2E测试（UI模式）
npm run test:e2e:ui
```

## 核心业务流程

### 1. 作文批改流程

用户上传作文图片 → OCR识别文本 → 用户确认/编辑文本 → 调用AI批改 → 解析评分结果 → 保存批改记录 → 提取亮点到亮点库 → 记录错误到易错点 → 展示批改结果

### 2. 易错点追踪逻辑

批改完成 → 提取错误类型 → 检查是否已存在 → 不存在则创建记录/存在则次数+1 → 次数≥2标记为易错点 → 保存错误实例

## API 文档

### 主要接口列表

| 方法 | 路径 | 描述 |
|-----|------|-----|
| POST | `/api/upload` | 上传图片到Storage |
| POST | `/api/ocr` | 手写文字识别 |
| POST | `/api/essays` | 创建作文提交 |
| GET | `/api/essays` | 获取作文列表 |
| GET | `/api/essays/[id]` | 获取作文详情 |
| POST | `/api/correct` | AI批改作文 |
| POST | `/api/generate/model-essay` | 生成范文 |
| POST | `/api/generate/copybook` | 生成字帖PDF |
| GET | `/api/highlights` | 获取亮点库 |
| POST | `/api/highlights` | 添加亮点 |
| GET | `/api/error-points` | 获取易错点列表 |
| GET | `/api/error-points/[id]` | 获取易错点详情 |
| GET | `/api/stats` | 获取统计数据 |

详细API文档参见 [architecture.md](./architecture.md)

## 数据库模型

### 核心表结构

- **essay_submissions** - 作文提交记录
- **corrections** - AI批改结果
- **model_essays** - 生成的范文
- **highlights_library** - 用户亮点库
- **error_points** - 错误类型统计
- **error_instances** - 具体错误实例
- **copybooks** - 生成的字帖

完整ER图参见 [architecture.md#数据模型图](./architecture.md)

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 开发规范

- **代码风格**：使用ESLint + Next.js配置
- **组件规范**：Functional Component + Hooks
- **样式规范**：Tailwind CSS，遵循设计Token
- **类型安全**：TypeScript严格模式，禁用any
- **测试要求**：UI修改需通过Playwright浏览器测试

## 路线图

### V1.1 当前版本
- [x] 多OCR提供商支持
- [x] 多LLM提供商支持
- [x] 易错点知识讲解
- [x] 错题练习生成

### V2.0 规划功能
- [ ] KET作文支持
- [ ] 亮点向量检索
- [ ] 每周学习报告
- [ ] 付费订阅系统
- [ ] 家长端小程序

## 常见问题

### Q: 支持哪些OCR服务？
A: 目前支持百度OCR、腾讯云OCR和Claude Vision，可在环境变量中配置切换。

### Q: LLM可以替换吗？
A: 可以，项目使用OpenAI-compatible接口，支持DashScope、Kimi、OpenAI、DeepSeek等任意兼容服务商。

### Q: 字帖PDF的字体是什么？
A: 使用 Gochi Hand Regular 字体（OFL开源授权），模拟手写体风格。

### Q: PET评分标准是什么？
A: 采用PET官方4维度评分（Content内容/Communication沟通/Organization组织/Language语言），每维度0-5分，总分20分。

## 许可证

[MIT](./LICENSE)

## 联系我们

如有问题或建议，欢迎提交 Issue 或联系维护团队。

---

<p align="center">
  Made with ❤️ for PET learners
</p>
