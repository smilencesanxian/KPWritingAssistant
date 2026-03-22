# KP作文宝 补充页面设计 - 细节完善

> 本文档补充易错点详情页、手动输入页等细节设计。

---

# 一、易错点详情页 (Mistake Detail Page)

## 1.1 页面概述

**页面ID**: `page-mistake-detail`
**进入方式**: 易错点页点击某个分类
**页面目的**: 展示单个易错类型的知识点讲解、错误例句、练习题

## 1.2 页面布局

```
┌─────────────────────────────────┐
│ 状态栏                           │
├─────────────────────────────────┤
│ ← 返回              [已掌握 ✓]  │
│      主谓一致                    │
│      出现 3 次 · 最后 2026-03-16 │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📘 知识点讲解                │ │
│ │                             │ │
│ │ 第三人称单数主语 (he/she/it/ │ │
│ │ 单数名词) 后，动词必须加 -s/ │ │
│ │ -es。                       │ │
│ │                             │ │
│ │ 例句：                       │ │
│ │ • He likes apples. ✓        │ │
│ │ • He like apples. ✗         │ │
│ │                             │ │
│ │ [查看视频讲解 ▶]             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ✏️ 你的典型错句              │ │
│ │                             │ │
│ │ 1. "He go to park."         │ │
│ │    2026-03-16               │ │
│ │                             │ │
│ │ 2. "She like ice-cream."    │ │
│ │    2026-03-14               │ │
│ │                             │ │
│ │ 3. "My brother play ball."  │ │
│ │    2026-03-10               │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📝 练习题                    │ │
│ │                             │ │
│ │ 1. She _____ (go) to school │ │
│ │    正确答案：goes           │ │
│ │    [查看解析]               │ │
│ │                             │ │
│ │ 2. He _____ (like) reading  │ │
│ │    正确答案：likes          │ │
│ │                             │ │
│ │ 3. My cat _____ (sleep) a   │ │
│ │    lot.                     │ │
│ │    正确答案：sleeps         │ │
│ └─────────────────────────────┘ │
│                                 │
│    [🧩 生成本类专项练习纸]       │
│                                 │
└─────────────────────────────────┘
```

## 1.3 视觉规范

### 知识点卡片
```
背景: --info-50 (#F2F7FF)
圆角: 20px
内边距: 16px
边框: 1px solid --info-200 (#D9E6FF)

标题:
  - 图标: fa-chalkboard-user, 18px, --primary-500
  - 文字: "知识点讲解", 16px, 600, --neutral-800
  - 间距: 图标与文字 6px

内容文字:
  - 字号: 15px
  - 行高: 1.7
  - 颜色: --neutral-700

例句:
  - 正确: ● + 绿色文字 --success-600
  - 错误: ● + 红色文字 --error-600

视频按钮:
  - 背景: transparent
  - 边框: 1.5px solid --primary-500
  - 圆角: 24px
  - 内边距: 8px 16px
  - 文字: --primary-500, 14px, 500
  - 图标: fa-play-circle, 16px
```

### 错句列表
```
卡片: 标准卡片样式

错句项:
  - 序号: 16px, 600, --primary-500
  - 原文: 15px, --neutral-800
  - 错误词: error-mark 样式
  - 日期: 12px, --neutral-500, 右侧对齐
  - 间距: 每项 16px 垂直间距
```

### 练习题区域
```
题目卡片:
  - 背景: white
  - 圆角: 12px
  - 内边距: 14px
  - 阴影: --shadow-sm

题目文字:
  - 字号: 15px
  - 颜色: --neutral-800

填空下划线:
  - border-bottom: 2px solid --neutral-400
  - 宽度: 80px
  - 显示: "_____"

答案:
  - 标签: "正确答案：", 13px, --neutral-500
  - 答案词: 14px, 600, --success-600

解析按钮:
  - 文字: "查看解析", 13px, --primary-500
  - 图标: fa-chevron-right, 10px
```

### "已掌握"按钮
```
位置: 导航栏右侧
默认态:
  - 文字: "标记已掌握", 14px, --neutral-500
  - 图标: fa-circle-check, 16px

已掌握态:
  - 文字: "已掌握", 14px, --success-500
  - 图标: fa-check-circle, 16px (实心)
```

## 1.4 交互逻辑

```
页面加载:
  ├── 显示知识点 (静态内容)
  ├── 加载用户错句列表 (本地/云端)
  └── 加载练习题 (预设题库)

用户操作:
  ├── 点击视频讲解 → 播放视频 (底部弹窗或跳转)
  ├── 点击"查看解析" → 展开解析文字
  ├── 点击"生成本类专项练习纸" → 生成PDF
  └── 点击"标记已掌握" → 确认弹窗 → 标记成功

标记已掌握确认弹窗:
  标题: "确认标记已掌握？"
  内容: "标记后该易错点将不再出现在首页提醒中，你可以在"我的易错点"中查看。"
  按钮: [取消] [确认标记]
```

---

# 二、手动输入页 (Manual Input Page)

## 2.1 页面概述

**页面ID**: `page-manual-input`
**进入方式**: 
- OCR识别失败时选择"手动输入"
- 首页提供"直接输入作文"入口（可选）

**页面目的**: 让用户手动输入作文文本，用于OCR失败时的备选方案

## 2.2 页面布局

```
┌─────────────────────────────────┐
│ 状态栏                           │
├─────────────────────────────────┤
│ ← 返回                           │
│      手动输入作文                │
├─────────────────────────────────┤
│                                 │
│ 作文标题                         │
│ ┌─────────────────────────────┐ │
│ │ My Favorite Hobby           │ │
│ └─────────────────────────────┘ │
│                                 │
│ 作文内容                         │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ I go to library every       │ │
│ │ Sunday. I enjoy reading     │ │
│ │ books because it's fun...   │ │
│ │                             │ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 字数: 128 字                     │
│                                 │
├─────────────────────────────────┤
│    [开始批改]                    │
└─────────────────────────────────┘
```

## 2.3 视觉规范

### 标题输入框
```
高度: 48px
背景: --neutral-100
圆角: 12px
内边距: 0 16px
字体: 16px, --neutral-800
占位符: "请输入作文标题", --neutral-400

聚焦态:
  - 边框: 1.5px solid --primary-500
  - 背景: white
```

### 内容输入框
```
高度: 自适应 (最小 200px)
背景: --neutral-100
圆角: 12px
内边距: 16px
字体: 16px, --neutral-800
行高: 1.8
占位符: "请输入作文内容..."

聚焦态:
  - 边框: 1.5px solid --primary-500
  - 背景: white
```

### 字数统计
```
位置: 内容框右下角
文字: "字数: X 字"
字号: 13px
颜色: --neutral-500

接近上限 (PET作文通常100-150词):
  - 颜色: --warning-500

超过合理范围:
  - 颜色: --error-500
```

### 底部按钮
```
固定在底部安全区上方
主按钮: "开始批改"
禁用态: 标题或内容为空时
```

## 2.4 键盘适配

```
输入框获得焦点:
  ├── 键盘弹出
  ├── 页面内容上移
  └── 输入框保持在可视区域中央

点击键盘外区域:
  └── 键盘收起

点击"完成":
  ├── 键盘收起
  └── 保持当前输入框状态
```

## 2.5 交互流程

```
用户输入:
  ├── 实时字数统计
  ├── 自动保存草稿 (LocalStorage)
  └── 检测输入语言 (非英文提示)

点击开始批改:
  ├── 验证: 标题非空，内容不少于20词
  ├── 验证失败 → Toast提示
  └── 验证成功 → 进入AI批改 Loading
```

---

# 三、设计走查 Checklist

## 3.1 视觉走查

### 颜色
- [ ] 所有颜色使用设计系统Token，无硬编码
- [ ] 主色 `#2D6EE0` 应用正确
- [ ] 语义颜色使用正确（成功/警告/错误）
- [ ] 文字颜色层级清晰（标题/正文/辅助）
- [ ] 禁用状态颜色统一 `--neutral-300`

### 字体
- [ ] 字号使用规范层级（Display/H1-H4/Body/Caption）
- [ ] 中文使用系统字体栈（苹圆/思源）
- [ ] 英文使用系统字体栈（SF Pro/Helvetica）
- [ ] 字重使用规范（400/500/600/700）
- [ ] 行高符合规范（1.5-1.8倍）

### 间距
- [ ] 使用 4px 基值间距系统
- [ ] 页面边距统一 20px
- [ ] 卡片内边距统一 16px
- [ ] 列表项间距一致
- [ ] 按钮高度统一 48px（主按钮）/ 44px（次按钮）

### 圆角
- [ ] 卡片圆角 20px
- [ ] 按钮圆角 40px（full）
- [ ] 输入框圆角 12px
- [ ] 标签圆角 12px-30px（根据类型）
- [ ] 保持一致性，无随机圆角值

### 阴影
- [ ] 卡片阴影 `--shadow-sm`
- [ ] 按钮阴影 `--shadow-lg`（仅主按钮）
- [ ] 弹窗/下拉阴影 `--shadow-xl`
- [ ] 无多余或缺失阴影

## 3.2 交互走查

### 状态完整
- [ ] 默认状态
- [ ] Hover状态（桌面端）
- [ ] 按下/Active状态
- [ ] 禁用状态
- [ ] 加载状态
- [ ] 空状态
- [ ] 错误状态
- [ ] 成功状态

### 反馈及时
- [ ] 按钮点击有视觉反馈（涟漪/缩放）
- [ ] 加载操作有Loading提示
- [ ] 操作成功有Toast提示
- [ ] 操作失败有错误提示
- [ ] 网络异常有状态提示

### 手势支持
- [ ] 列表支持下拉刷新
- [ ] 列表支持上拉加载更多
- [ ] 左滑显示操作按钮
- [ ] 长按显示操作菜单
- [ ] 图片支持双指缩放

### 输入体验
- [ ] 输入框有焦点状态
- [ ] 键盘弹出时页面适配
- [ ] 有完成/下一步按钮
- [ ] 表单有校验提示
- [ ] 支持键盘快捷键（桌面端）

## 3.3 性能走查

- [ ] 图片懒加载
- [ ] 列表虚拟滚动（长列表）
- [ ] 资源预加载（关键资源）
- [ ] 动画使用 transform/opacity（GPU加速）
- [ ] 避免重排重绘

## 3.4 无障碍走查

- [ ] 图片有 alt 描述
- [ ] 按钮有 aria-label
- [ ] 颜色对比度符合 WCAG 4.5:1
- [ ] 支持系统字体大小设置
- [ ] 减少动画偏好支持

---

# 四、微信小程序适配规范

## 4.1 页面配置

### 导航栏
```json
{
  "navigationBarBackgroundColor": "#FFFFFF",
  "navigationBarTextStyle": "black",
  "navigationBarTitleText": "PET写匠",
  "navigationStyle": "default"
}
```

### TabBar
```json
{
  "tabBar": {
    "color": "#8E98A3",
    "selectedColor": "#2D6EE0",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/home/index",
        "text": "首页",
        "iconPath": "images/home.png",
        "selectedIconPath": "images/home-active.png"
      },
      {
        "pagePath": "pages/correction/index",
        "text": "批改",
        "iconPath": "images/correction.png",
        "selectedIconPath": "images/correction-active.png"
      },
      {
        "pagePath": "pages/mistake/index",
        "text": "易错点",
        "iconPath": "images/mistake.png",
        "selectedIconPath": "images/mistake-active.png"
      },
      {
        "pagePath": "pages/highlight/index",
        "text": "亮点库",
        "iconPath": "images/highlight.png",
        "selectedIconPath": "images/highlight-active.png"
      }
    ]
  }
}
```

## 4.2 组件替代方案

| 设计组件 | 微信小程序组件 | 注意事项 |
|----------|----------------|----------|
| 按钮 | `button` | 需重置默认样式 |
| 输入框 | `input` / `textarea` | 注意focus/blur事件 |
| 列表 | `scroll-view` | 下拉刷新用 `onPullDownRefresh` |
| 弹窗 | `van-popup` (Vant) | 或自定义 |
| 加载 | `van-loading` (Vant) | 或自定义 |
| 图标 | `van-icon` / 图片 | Font Awesome需转换 |

## 4.3 rpx 适配

```css
/* 设计稿 375px 对应小程序 750rpx */
/* 换算公式: rpx = px * 2 */

/* 示例 */
.page {
  padding: 0 40rpx;  /* 20px */
}

.card {
  border-radius: 40rpx;  /* 20px */
  padding: 32rpx;  /* 16px */
}

.btn-primary {
  height: 96rpx;  /* 48px */
  border-radius: 80rpx;  /* 40px */
}
```

## 4.4 安全区域适配

```css
/* iPhone X+ 安全区 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 底部固定按钮 */
.fixed-bottom {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

## 4.5 微信小程序特有API

### 相机与图片
```javascript
// 拍照
wx.chooseMedia({
  mediaType: ['image'],
  sourceType: ['camera'],
  success: (res) => { }
})

// 从相册选择
wx.chooseImage({
  count: 1,
  sourceType: ['album'],
  success: (res) => { }
})

// 预览图片
wx.previewImage({
  urls: [imageUrl],
  current: imageUrl
})
```

### 文件下载与预览
```javascript
// 下载PDF
wx.downloadFile({
  url: pdfUrl,
  success: (res) => {
    // 预览PDF
    wx.openDocument({
      filePath: res.tempFilePath,
      fileType: 'pdf'
    })
  }
})
```

### 权限处理
```javascript
// 检查相机权限
wx.getSetting({
  success: (res) => {
    if (!res.authSetting['scope.camera']) {
      // 申请权限
      wx.authorize({
        scope: 'scope.camera',
        fail: () => {
          // 引导用户去设置
          wx.showModal({
            title: '需要相机权限',
            content: '请前往设置开启相机权限',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        }
      })
    }
  }
})
```

### 订阅消息（每周提醒）
```javascript
// 申请订阅权限
wx.requestSubscribeMessage({
  tmplIds: ['TEMPLATE_ID'],
  success: (res) => {
    if (res['TEMPLATE_ID'] === 'accept') {
      // 用户同意订阅
    }
  }
})
```

---

*文档版本: v1.0*
*更新日期: 2026-03-16*
*作者: UX Design Agent*
