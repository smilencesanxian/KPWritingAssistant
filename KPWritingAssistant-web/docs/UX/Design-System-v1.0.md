# KP作文宝 设计系统规范 v1.0

> 本文档为开发落地提供完整的设计参数，所有数值必须精确还原。

---

## 1. 色彩系统 (Color System)

### 1.1 主色调 - 智慧蓝 (Primary Blue)

| Token | Hex | RGB | 使用场景 |
|-------|-----|-----|----------|
| `--primary-50` | `#E8F0FE` | 232, 240, 254 | 背景高亮、浅色填充 |
| `--primary-100` | `#D2E2FC` | 210, 226, 252 | 悬停背景、轻量强调 |
| `--primary-200` | `#A6C4FA` | 166, 196, 250 | 禁用状态背景 |
| `--primary-300` | `#79A7F7` | 121, 167, 247 | 次要按钮边框 |
| `--primary-400` | `#4D89F5` | 77, 137, 245 | 图标选中态 |
| `--primary-500` | `#2D6EE0` | 45, 110, 224 | **主按钮、品牌色** |
| `--primary-600` | `#1A5FD4` | 26, 95, 212 | 按钮按下态 |
| `--primary-700` | `#1550B0` | 21, 80, 176 | 深色强调文字 |
| `--primary-800` | `#10408C` | 16, 64, 140 | 标题文字 |
| `--primary-900` | `#0B3169` | 11, 49, 105 | 深色背景 |

### 1.2 语义颜色 (Semantic Colors)

| 类型 | Token | 背景色 | 文字色 | 边框色 | 使用场景 |
|------|-------|--------|--------|--------|----------|
| 成功 Success | `--success-*` | `#E6F7E6` | `#1F8B4C` | `#4CAF50` | 亮点提取成功、操作完成 |
| 警告 Warning | `--warning-*` | `#FFF5E0` | `#A86903` | `#FFAE42` | 提示信息、易错点提醒 |
| 错误 Error | `--error-*` | `#FFE5E5` | `#C03535` | `#FF6B6B` | 错误标注、失败提示 |
| 信息 Info | `--info-*` | `#E8F0FE` | `#1D3A78` | `#2D6EE0` | 一般提示、知识点讲解 |

### 1.3 中性色 (Neutral Colors)

| Token | Hex | 使用场景 |
|-------|-----|----------|
| `--neutral-0` | `#FFFFFF` | 纯白背景、按钮文字 |
| `--neutral-50` | `#FAFBFC` | 页面背景 |
| `--neutral-100` | `#F5F7FB` | 卡片背景、输入框背景 |
| `--neutral-200` | `#EDF0F5` | 分割线、边框 |
| `--neutral-300` | `#E0E4EB` | 禁用边框 |
| `--neutral-400` | `#B8C0CC` | 占位文字、禁用文字 |
| `--neutral-500` | `#8E98A3` | 次要文字、图标默认态 |
| `--neutral-600` | `#5C6A7E` | 辅助文字 |
| `--neutral-700` | `#3A4A62` | 正文文字 |
| `--neutral-800` | `#1E2E4D` | 标题文字、主内容 |
| `--neutral-900` | `#0B1B32` | 最深文字、导航标题 |

---

## 2. 字体系统 (Typography)

### 2.1 字体栈

```css
/* 中文 */
font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

/* 英文 */
font-family: -apple-system, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif;
```

### 2.2 字号层级 (Type Scale)

| 样式 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| **Display** | 28px | 36px | 700 | 首页大数字统计 |
| **H1** | 24px | 32px | 700 | 页面标题 |
| **H2** | 20px | 28px | 600 | 卡片标题、区域标题 |
| **H3** | 18px | 26px | 600 | 子标题 |
| **H4** | 16px | 24px | 600 | 列表项标题 |
| **Body Large** | 16px | 24px | 400 | 主要正文、作文内容 |
| **Body** | 14px | 22px | 400 | 正文、描述文字 |
| **Body Small** | 13px | 20px | 400 | 辅助说明 |
| **Caption** | 12px | 18px | 400 | 标签、时间戳 |
| **Overline** | 11px | 16px | 500 | 统计标签、分类标签 |

### 2.3 字重映射

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `--font-regular` | 400 | 正文、描述 |
| `--font-medium` | 500 | 按钮文字、标签 |
| `--font-semibold` | 600 | 标题、强调 |
| `--font-bold` | 700 | 大标题、统计数字 |

---

## 3. 间距系统 (Spacing System)

### 3.1 基础间距 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-0` | 0px | 无间距 |
| `--space-1` | 4px | 图标与文字间距、紧凑内边距 |
| `--space-2` | 8px | 小间距、元素间紧凑间距 |
| `--space-3` | 12px | 标准内边距、列表项间距 |
| `--space-4` | 16px | 卡片内边距、段落间距 |
| `--space-5` | 20px | 页面水平内边距 |
| `--space-6` | 24px | 大模块间距 |
| `--space-8` | 32px | 区块间距 |
| `--space-10` | 40px | 大按钮高度、大圆角 |
| `--space-12` | 48px | 底部导航高度 |

### 3.2 页面布局参数

```
/* 页面容器 */
--page-padding-x: 20px;        /* 左右边距 */
--page-padding-y: 16px;        /* 上下边距 */

/* 卡片 */
--card-padding: 16px;
--card-margin-bottom: 16px;
--card-border-radius: 20px;

/* 列表项 */
--list-item-padding-y: 12px;
--list-item-gap: 0px;

/* 按钮 */
--btn-padding-y: 14px;
--btn-padding-x: 24px;
--btn-border-radius: 40px;
```

---

## 4. 圆角系统 (Border Radius)

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `--radius-none` | 0px | 无圆角 |
| `--radius-sm` | 8px | 小标签、输入框 |
| `--radius-md` | 12px | 按钮、提示条 |
| `--radius-lg` | 16px | 卡片、弹窗 |
| `--radius-xl` | 20px | 大卡片、统计卡片 |
| `--radius-full` | 9999px | 胶囊按钮、头像 |

---

## 5. 阴影系统 (Shadow System)

| Token | 值 | 使用场景 |
|-------|-----|----------|
| `--shadow-none` | none | 平铺元素 |
| `--shadow-sm` | `0 2px 4px rgba(0,0,0,0.02)` | 卡片基础阴影 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.04)` | 卡片悬浮阴影 |
| `--shadow-lg` | `0 10px 20px rgba(45,110,224,0.3)` | 主按钮阴影 |
| `--shadow-xl` | `0 25px 60px rgba(0,0,0,0.25)` | 手机容器展示 |
| `--shadow-top` | `0 -2px 10px rgba(0,0,0,0.02)` | 底部导航阴影 |

---

## 6. 组件规范 (Component Specifications)

### 6.1 按钮 (Button)

#### 主按钮 (Primary Button)
```
高度: 48px (padding: 14px 24px)
背景: --primary-500 (#2D6EE0)
文字: --neutral-0, 16px, font-weight: 600
圆角: --radius-full (40px)
阴影: --shadow-lg

状态:
- 默认: 如上
- 按下: background: --primary-600, transform: scale(0.98)
- 禁用: background: --primary-200, color: --neutral-400
```

#### 次要按钮 (Secondary Button)
```
高度: 44px (padding: 12px 20px)
背景: --neutral-0
边框: 1.5px solid --primary-500
文字: --primary-500, 15px, font-weight: 600
圆角: --radius-full (40px)

状态:
- 默认: 如上
- 按下: background: --primary-50
- 禁用: border-color: --neutral-300, color: --neutral-400
```

#### 图标按钮 (Icon Button)
```
尺寸: 40px × 40px
背景: transparent
图标: 22px, --neutral-600

状态:
- 按下: background: --neutral-100, border-radius: 50%
```

### 6.2 卡片 (Card)

```
背景: --neutral-0 (#FFFFFF)
圆角: --radius-xl (20px)
内边距: --space-4 (16px)
阴影: --shadow-sm (0 4px 12px rgba(0,0,0,0.02))
边框: 1px solid #F0F2F6 (可选，用于更清晰的边界)

外边距: margin-bottom: --space-4 (16px)
```

### 6.3 输入框 (Input)

```
高度: 自适应（多行）/ 48px（单行）
背景: --neutral-100 (#F5F7FB)
边框: 1px solid transparent
圆角: --radius-md (12px)
内边距: 12px 16px
字体: --body (14px, 400)

状态:
- 聚焦: border-color: --primary-500, background: --neutral-0
- 禁用: background: --neutral-200, color: --neutral-400
- 错误: border-color: --error-500, 底部显示错误文字
```

### 6.4 标签/徽章 (Tag/Badge)

#### 分数徽章
```
背景: --neutral-900 (#0B1B32)
文字: --neutral-0, 14px, font-weight: 600
圆角: --radius-full
内边距: 4px 12px
```

#### 维度标签
```
背景: --neutral-100 (#F5F7FB)
文字: --neutral-700, 14px
圆角: --radius-full
内边距: 8px 14px
```

#### 错误下划线标注
```
背景: --error-50 (#FFE5E5)
文字: --error-600, font-weight: 500
下边框: 2px dashed --error-400
内边距: 0 2px
```

#### 亮点高亮标注
```
背景: --success-50 (#E6F7E6)
文字: --success-600, font-weight: 500
下边框: 2px solid --success-400
内边距: 0 2px
```

### 6.5 底部导航 (Tab Bar)

```
高度: 70px
背景: --neutral-0
边框: 1px solid --neutral-200 (仅顶部)
阴影: --shadow-top

Tab 项:
- 图标: 22px, 默认 --neutral-500, 选中 --primary-500
- 文字: 12px, 默认 --neutral-500, 选中 --primary-500
- 间距: 图标与文字 gap 4px
```

### 6.6 列表项 (List Item)

```
高度: 自适应（最小 56px）
内边距: --list-item-padding-y (12px) 0
边框: 1px solid --neutral-200 (底部，最后一项无)

结构:
- 左侧: 图标/标题区域（flex: 1）
- 右侧: 操作/数值区域
```

### 6.7 提示条 (Reminder Bar)

```
背景: --info-50 (#EEF3FE)
圆角: --radius-md (16px)
内边距: 12px 16px
文字: --info-800 (#1D3A78), 14px
图标: 与文字间距 10px
```

### 6.8 范文级别选择器 (Level Selector)

```
容器: flex, gap: 8px

按钮默认态:
- 背景: --neutral-100 (#F0F2F6)
- 文字: --neutral-600 (#4D5F73), 14px, 500
- 圆角: --radius-full
- 内边距: 8px 0 (flex: 1, 等宽)

按钮选中态:
- 背景: --primary-500
- 文字: --neutral-0
- 边框: 1px solid --primary-500
- 阴影: 0 4px 8px rgba(45,110,224,0.2)
```

---

## 7. 页面特定规范

### 7.1 状态栏 (Status Bar)

```
高度: 44px (iOS安全区)
背景: --neutral-0
内边距: 12px 20px 6px
文字: 14px, font-weight: 500, --neutral-900
```

### 7.2 导航栏 (Header)

```
高度: 52px
背景: --neutral-0
内边距: 8px 20px 4px
边框: 1px solid --neutral-200 (底部)

标题: 20px, font-weight: 700, --neutral-900
图标: 22px, --neutral-700
```

### 7.3 作文内容区 (Writing Box)

```
背景: #F8FAFF (作文专用浅蓝背景)
圆角: --radius-md (16px)
内边距: 14px
边框: 4px solid --primary-500 (左侧强调条)
字体: --body-large (16px), line-height: 1.6
```

---

## 8. 动画与过渡 (Animation)

### 8.1 时长 (Duration)

| Token | 值 | 用途 |
|-------|-----|------|
| `--duration-fast` | 100ms | 微交互、按钮按下 |
| `--duration-normal` | 200ms | 状态切换、hover |
| `--duration-slow` | 300ms | 页面转场、弹窗 |
| `--duration-loading` | 800ms | 加载动画循环 |

### 8.2 缓动函数 (Easing)

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 8.3 常用动画

```css
/* 按钮按下 */
transform: scale(0.98);
transition: transform var(--duration-fast) var(--ease-out);

/* 页面切换 */
opacity: 0 → 1;
transform: translateX(20px) → translateX(0);
transition: all var(--duration-slow) var(--ease-out);

/* 加载旋转 */
animation: spin var(--duration-loading) linear infinite;

/* 脉冲效果 (新内容提示) */
animation: pulse 2s var(--ease-default) infinite;
```

---

## 9. 图标规范

### 9.1 图标库
使用 **Font Awesome 6** (solid/regular)

### 9.2 图标尺寸

| 场景 | 尺寸 | 示例 |
|------|------|------|
| 导航图标 | 22px | 首页、批改、易错点、亮点库 |
| 按钮图标 | 20-24px | 拍照、下载、生成 |
| 列表图标 | 18px | 箭头、删除 |
| 状态图标 | 16px | 提示、警告 |
| 大图标 | 32px | PDF预览、空状态 |

### 9.3 图标对照表

| 功能 | 图标类名 | 类型 |
|------|----------|------|
| 首页 | `fa-house` | regular |
| 批改/编辑 | `fa-pen-to-square` | regular |
| 易错点 | `fa-circle-exclamation` | regular |
| 亮点库 | `fa-star` | regular |
| 拍照 | `fa-camera` | solid |
| 相册 | `fa-images` | regular |
| 下载 | `fa-circle-down` | regular |
| 删除 | `fa-trash` | regular |
| 返回 | `fa-chevron-left` | solid |
| 关闭 | `fa-xmark` | solid |
| 加载 | `fa-circle-notch` / `fa-spinner` | solid |
| 成功 | `fa-circle-check` | regular |
| 警告 | `fa-triangle-exclamation` | solid |
| 错误 | `fa-circle-xmark` | regular |
| 通知 | `fa-bell` | regular |
| PDF文件 | `fa-file-lines` / `fa-file-pdf` | regular |
| 灯泡/提示 | `fa-lightbulb` | solid |
| 闪光/亮点 | `fa-bolt` / `fa-wand-magic-sparkles` | solid |
| 日历 | `fa-calendar` | regular |
| 打印 | `fa-print` | solid |
| 分享 | `fa-share-nodes` | solid |

---

## 10. 响应式与适配

### 10.1 断点

| 断点 | 宽度 | 适配说明 |
|------|------|----------|
| Mobile | < 375px | 基础布局，元素紧凑 |
| Mobile Large | 375px - 428px | 标准布局 |
| Tablet | 428px - 768px | 适当增加间距 |

### 10.2 安全区域

```css
/* iOS 安全区适配 */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

### 10.3 字体缩放适配

```css
/* 支持系统字体大小设置 */
font-size: 14px; /* 基准 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. 命名规范

### 11.1 CSS 类名 BEM 规范

```
.block { }
.block__element { }
.block--modifier { }

示例:
.btn { }
.btn__icon { }
.btn--primary { }
.btn--disabled { }
```

### 11.2 文件命名

```
组件: PascalCase (e.g., PhotoCapture.vue)
页面: kebab-case (e.g., correction-result.vue)
样式: kebab-case (e.g., design-tokens.css)
图片: kebab-case (e.g., empty-state-illustration.svg)
```

---

*文档版本: v1.0*
*更新日期: 2026-03-16*
*作者: UX Design Agent*
