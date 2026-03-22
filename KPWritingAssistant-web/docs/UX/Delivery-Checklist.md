# KP作文宝 设计交付清单

> 本文档汇总所有设计交付物，方便开发团队快速定位所需资源。

---

## 📦 交付物清单

### 1. 高保真原型

| 文件 | 路径 | 说明 | 状态 |
|------|------|------|------|
| HTML原型 | `/docs/UX/deepseek_html_20260316_0d2ce2.html` | 可点击的高保真原型，含4个主页面 | ✅ 可用 |

**使用方法**:
```bash
# 直接用浏览器打开
open /mnt/d/OpenClaw/KPWritingAssistant-WX/docs/UX/deepseek_html_20260316_0d2ce2.html
```

**原型包含页面**:
- 首页（统计、拍照按钮、历史记录）
- 批改结果页（评分、原文标注、范文、字帖生成）
- 易错点页（易错列表、小专题、练习纸）
- 亮点库页（亮点列表、智能提示）

---

### 2. 设计规范文档

| 文件 | 路径 | 内容概述 | 页数 |
|------|------|----------|------|
| 设计系统规范 | `Design-System-v1.0.md` | 颜色、字体、间距、圆角、阴影、组件、动画 | ~25页 |
| 缺失页面设计 | `Page-Designs-Supplement.md` | 拍照页、Loading页、字帖预览、历史记录、我的页等11页 | ~30页 |
| 交互流程文档 | `Interaction-Flow.md` | 用户流程、状态机、Loading规范、错误处理 | ~20页 |
| 细节页面设计 | `Page-Details-Supplement.md` | 易错点详情、手动输入、设计走查、小程序适配 | ~20页 |
| 开发速查表 | `Dev-Quick-Reference.md` | 颜色/字体/间距速查、组件代码、错误码对照 | ~10页 |

---

## 🎨 设计Token速查

### 颜色Token
```css
/* 主色 */
--primary-500: #2D6EE0;    /* 品牌色、主按钮 */
--primary-50:  #E8F0FE;    /* 浅色背景 */
--primary-600: #1A5FD4;    /* 按下态 */

/* 语义色 */
--success-500: #1F8B4C;    /* 亮点、成功 */
--warning-500: #F9A826;    /* 提示 */
--error-500:   #C03535;    /* 错误标注 */
--info-500:    #2D6EE0;    /* 知识点 */

/* 中性色 */
--neutral-900: #0B1B32;    /* 标题 */
--neutral-800: #1E2E4D;    /* 正文 */
--neutral-700: #3A4A62;    /* 次要正文 */
--neutral-500: #8E98A3;    /* 辅助文字 */
--neutral-100: #F5F7FB;    /* 卡片背景 */
--neutral-50:  #FAFBFC;    /* 页面背景 */
```

### 字体Token
```css
/* 字号 */
--text-display:  28px/36px 700;  /* 首页统计数字 */
--text-h1:       24px/32px 700;  /* 页面标题 */
--text-h2:       20px/28px 600;  /* 卡片标题 */
--text-body:     14px/22px 400;  /* 正文 */
--text-caption:  12px/18px 400;  /* 标签 */

/* 字重 */
--font-regular:  400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

### 间距Token
```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;  /* 卡片内边距 */
--space-5:  20px;  /* 页面边距 */
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;  /* 按钮高度 */
--space-12: 48px;
```

### 圆角Token
```css
--radius-sm:  8px;     /* 标签、输入框 */
--radius-md:  12px;    /* 按钮、卡片 */
--radius-lg:  16px;    /* 大卡片 */
--radius-xl:  20px;    /* 统计卡片 */
--radius-full: 9999px; /* 胶囊按钮 */
```

---

## 📱 页面清单（完整版）

### MVP核心页面（P0 - 必须有）

| 页面ID | 页面名称 | 文档位置 | 状态 |
|--------|----------|----------|------|
| `page-home` | 首页 | HTML原型 | ✅ |
| `page-capture` | 拍照页 | Page-Designs-Supplement | ✅ |
| `page-ocr-loading` | OCR识别Loading | Page-Designs-Supplement | ✅ |
| `page-correction-loading` | AI批改Loading | Page-Designs-Supplement | ✅ |
| `page-correction-result` | 批改结果页 | HTML原型 | ✅ |
| `page-copybook-preview` | 字帖预览页 | Page-Designs-Supplement | ✅ |
| `page-mistake` | 易错点列表页 | HTML原型 | ✅ |
| `page-mistake-detail` | 易错点详情页 | Page-Details-Supplement | ✅ |
| `page-highlight` | 亮点库页 | HTML原型 | ✅ |
| `page-profile` | 我的页 | Page-Designs-Supplement | ✅ |
| `page-history` | 历史记录页 | Page-Designs-Supplement | ✅ |

### 辅助页面（P1 - 重要）

| 页面ID | 页面名称 | 文档位置 | 状态 |
|--------|----------|----------|------|
| `page-manual-input` | 手动输入页 | Page-Details-Supplement | ✅ |
| `page-onboarding` | 引导页 | Page-Designs-Supplement | ✅ |

### 状态/弹窗（P1）

| 状态/弹窗 | 文档位置 | 状态 |
|-----------|----------|------|
| 拍照预览 | Page-Designs-Supplement | ✅ |
| Toast提示 | Interaction-Flow | ✅ |
| 空状态（各页面） | Page-Designs-Supplement | ✅ |
| 错误状态 | Interaction-Flow | ✅ |
| 权限引导 | Page-Details-Supplement | ✅ |
| 标记已掌握确认弹窗 | Page-Details-Supplement | ✅ |

---

## 🧩 组件清单

### 基础组件

| 组件名 | 文档位置 | 复杂度 | 说明 |
|--------|----------|--------|------|
| Button | Design-System-v1.0 | 低 | 主按钮、次要按钮、图标按钮 |
| Card | Design-System-v1.0 | 低 | 基础卡片容器 |
| Input | Design-System-v1.0 | 中 | 文本输入、多行输入 |
| Tag | Design-System-v1.0 | 低 | 分数徽章、维度标签 |
| ListItem | Design-System-v1.0 | 低 | 列表项（历史、易错点） |
| TabBar | Design-System-v1.0 | 低 | 底部导航 |

### 业务组件

| 组件名 | 文档位置 | 复杂度 | 说明 |
|--------|----------|--------|------|
| WritingBox | Design-System-v1.0 | 中 | 作文展示框（带边框强调） |
| ErrorMark | Design-System-v1.0 | 低 | 错误词标注样式 |
| HighlightMark | Design-System-v1.0 | 低 | 亮点词标注样式 |
| LevelSelector | Design-System-v1.0 | 中 | 范文级别三级选择器 |
| ScoreBadge | Design-System-v1.0 | 低 | 分数徽章 |
| ReminderBar | Design-System-v1.0 | 低 | 提示条组件 |
| MistakeItem | Page-Details-Supplement | 中 | 易错点列表项 |
| ExerciseCard | Page-Details-Supplement | 中 | 练习题卡片 |

### 动画组件

| 组件名 | 文档位置 | 复杂度 | 说明 |
|--------|----------|--------|------|
| ScanAnimation | Interaction-Flow | 中 | OCR扫描动画 |
| AIAnalysisAnimation | Interaction-Flow | 中 | AI分析动画 |
| PDFGenerateAnimation | Interaction-Flow | 低 | PDF生成动画 |
| Skeleton | Interaction-Flow | 低 | 骨架屏 |

---

## 📊 图标资源

### Font Awesome 图标

使用 **Font Awesome 6 Free** 版本

| 图标名称 | 类名 | 用途 | 大小 |
|----------|------|------|------|
| 首页 | `fa-house` | 底部导航 | 22px |
| 批改 | `fa-pen-to-square` | 底部导航 | 22px |
| 易错点 | `fa-circle-exclamation` | 底部导航 | 22px |
| 亮点库 | `fa-star` | 底部导航 | 22px |
| 拍照 | `fa-camera` | 拍照按钮 | 24px |
| 相册 | `fa-images` | 相册选择 | 24px |
| 下载 | `fa-circle-down` | 下载PDF | 20px |
| 打印 | `fa-print` | 打印 | 20px |
| 分享 | `fa-share-nodes` | 分享 | 20px |
| 返回 | `fa-chevron-left` | 返回 | 22px |
| 更多 | `fa-ellipsis-vertical` | 更多操作 | 18px |
| 成功 | `fa-circle-check` | 成功提示 | 18px |
| 警告 | `fa-triangle-exclamation` | 警告提示 | 18px |
| 错误 | `fa-circle-xmark` | 错误提示 | 18px |
| 灯泡 | `fa-lightbulb` | 提示 | 16px |
| PDF文件 | `fa-file-lines` | PDF预览 | 32px |
| 日历 | `fa-calendar` | 每周提醒 | 18px |
| 设置 | `fa-gear` | 设置 | 20px |
| 删除 | `fa-trash` | 删除 | 18px |
| 编辑 | `fa-pen` | 编辑 | 18px |
| 播放 | `fa-play-circle` | 视频讲解 | 16px |
| 对勾 | `fa-check` | 选中 | 14px |
| 关闭 | `fa-xmark` | 关闭 | 18px |

**引入方式**:
```html
<!-- HTML -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

<!-- 小程序（使用图标字体或图片） -->
<!-- 方案1: 使用图片 -->
<image src="/images/icons/home.png" />

<!-- 方案2: 使用Vant图标 -->
<van-icon name="home-o" />
```

---

## 🖼️ 图片资源需求

### 已有资源
- Font Awesome 图标（在线CDN）

### 需要设计/提供的资源

| 资源名称 | 尺寸 | 格式 | 用途 | 优先级 |
|----------|------|------|------|--------|
| 引导页插图1 | 400x400 | PNG/SVG | 拍照批改引导 | P1 |
| 引导页插图2 | 400x400 | PNG/SVG | 亮点积累引导 | P1 |
| 引导页插图3 | 400x400 | PNG/SVG | 字帖生成引导 | P1 |
| 空状态-无记录 | 240x240 | PNG/SVG | 历史记录空状态 | P1 |
| 空状态-无亮点 | 240x240 | PNG/SVG | 亮点库空状态 | P1 |
| 空状态-无易错点 | 240x240 | PNG/SVG | 易错点空状态 | P1 |
| 错误状态-断网 | 240x240 | PNG/SVG | 网络错误 | P1 |
| 错误状态-权限 | 240x240 | PNG/SVG | 权限被拒绝 | P2 |
| 加载动画-Lottie | - | JSON | OCR/AI加载动画 | P2 |
| TabBar图标 | 48x48 | PNG | 底部导航（4个选中+未选中）| P0 |

---

## 🔧 开发检查清单

### 开发前准备
- [ ] 阅读 Design-System-v1.0.md 了解设计规范
- [ ] 查看 HTML原型了解页面结构和交互
- [ ] 确认技术栈（微信小程序原生 / Taro / UniApp）
- [ ] 准备图标资源（Font Awesome 或 图片）
- [ ] 配置设计Token（颜色、字体、间距）

### 开发中检查
- [ ] 颜色使用Token，无硬编码
- [ ] 字体使用规范层级
- [ ] 间距使用4px基值系统
- [ ] 圆角使用规范值
- [ ] 按钮有完整的交互状态
- [ ] Loading状态完整
- [ ] 空状态已处理
- [ ] 错误状态已处理
- [ ] 适配iPhone安全区
- [ ] 适配rpx单位

### 开发后检查
- [ ] 与设计稿对比视觉还原度
- [ ] 交互流程走通
- [ ] 边界情况测试（无网络、无权限等）
- [ ] 性能检查（图片懒加载、列表优化）
- [ ] 无障碍检查

---

## 📞 设计支持

如有设计相关问题，请查阅：
1. **设计规范不明确** → 查看 `Design-System-v1.0.md`
2. **页面设计疑问** → 查看 `Page-Designs-Supplement.md` 或 `Page-Details-Supplement.md`
3. **交互逻辑疑问** → 查看 `Interaction-Flow.md`
4. **快速查参数** → 查看 `Dev-Quick-Reference.md`

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-03-16 | 初始版本，包含完整设计规范 | UX Design Agent |

---

*文档版本: v1.0*
*更新日期: 2026-03-16*
*作者: UX Design Agent*
