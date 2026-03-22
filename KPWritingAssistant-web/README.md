# KP作文宝

面向PET备考家庭的 **AI写作教练 + 智能字帖生成器 + 个性化错题本**，通过「批改 → 积累 → 练习」闭环，帮助孩子提升写作能力和卷面分。

## 功能亮点

- **拍照批改**：拍一张作文照片，AI 自动 OCR 提取文字，并完成评分、错误标注、整体点评
- **亮点积累**：从每篇批改中自动提取好词好句，建立个人亮点库
- **错题本**：自动识别高频错误，追踪各类错误的出现次数，帮助针对性练习
- **范文生成**：基于批改结果生成「通过/良好/优秀」三档范文，结合个人亮点库定制
- **字帖生成**：将范文生成可打印 PDF 字帖，供手写练习
- **历史记录**：查看所有批改历史，支持无限滚动加载

## 技术栈

- **前端**：Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **后端**：Next.js API Routes
- **数据库 / 认证 / 存储**：Supabase（PostgreSQL + RLS + Storage）
- **AI**：兼容 OpenAI 接口的任意 LLM（默认阿里云 DashScope 通义千问）
- **OCR**：百度智能云 OCR（手写识别）
- **PDF 生成**：pdfkit

## 本地开发环境搭建

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

打开 `.env.local` 并填写：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名公钥 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 |
| `LLM_API_KEY` | LLM API 密钥（默认 DashScope） |
| `LLM_BASE_URL` | LLM 接口地址（默认 DashScope） |
| `LLM_MODEL` | 模型名称（默认 `qwen-plus`） |
| `BAIDU_OCR_API_KEY` | 百度 OCR API Key |
| `BAIDU_OCR_SECRET_KEY` | 百度 OCR Secret Key |

**切换 LLM 提供商**（只需修改 3 个环境变量，无需改代码）：

```bash
# Kimi (Moonshot AI)
LLM_BASE_URL=https://api.moonshot.cn/v1
LLM_MODEL=moonshot-v1-32k

# DeepSeek
LLM_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat

# OpenAI
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
```

### 3. 初始化 Supabase 数据库

在 [Supabase Dashboard](https://supabase.com) 中：
1. 创建新项目，获取 URL 和 Keys
2. 进入 **SQL Editor**，运行 `supabase/migrations/001_initial_schema.sql`
3. 在 **Storage** 中确认已自动创建 `essay-images`（私有）和 `copybook-pdfs`（公开）两个 Bucket

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 目录结构

```
src/
├── app/
│   ├── api/           # API 路由（OCR、批改、范文、字帖、统计等）
│   └── (pages)/       # 页面（登录/注册/首页/历史/批改详情/亮点库/错题本）
├── components/
│   ├── auth/          # 登录/注册/退出组件
│   ├── home/          # 首页仪表盘（含 SWR 缓存）
│   └── ui/            # 通用 UI 组件
├── lib/
│   ├── ai/            # LLM 调用、OCR
│   ├── db/            # 数据库查询函数
│   ├── pdf/           # PDF 生成
│   ├── storage/       # Supabase Storage 上传
│   ├── supabase/      # Supabase 客户端
│   └── rate-limit.ts  # API 速率限制（3次/分钟）
└── types/             # TypeScript 类型定义
supabase/
└── migrations/        # 数据库迁移 SQL
```

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run lint     # 代码检查
```
