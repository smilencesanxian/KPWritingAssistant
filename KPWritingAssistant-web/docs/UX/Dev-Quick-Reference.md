# KP作文宝 开发快速参考表

> 一页纸速查表，方便开发时快速查阅关键参数。

---

## 🎨 颜色速查

### 主色 (Primary Blue)
```css
--primary-500: #2D6EE0;  /* 主按钮、品牌色 */
--primary-50:  #E8F0FE;  /* 浅背景 */
--primary-600: #1A5FD4;  /* 按下态 */
```

### 语义色
```css
/* 成功 - 亮点 */
--success-50:  #E6F7E6;
--success-500: #1F8B4C;

/* 警告 - 提示 */
--warning-50:  #FFF5E0;
--warning-600: #A86903;

/* 错误 - 错误标注 */
--error-50:    #FFE5E5;
--error-500:   #C03535;
```

### 中性色
```css
--neutral-0:   #FFFFFF;  /* 纯白 */
--neutral-50:  #FAFBFC;  /* 页面背景 */
--neutral-100: #F5F7FB;  /* 卡片背景 */
--neutral-200: #EDF0F5;  /* 分割线 */
--neutral-500: #8E98A3;  /* 次要文字 */
--neutral-700: #3A4A62;  /* 正文 */
--neutral-800: #1E2E4D;  /* 标题 */
--neutral-900: #0B1B32;  /* 最深 */
```

---

## 🔤 字体速查

```css
/* 字体栈 */
font-family: -apple-system, "PingFang SC", "Hiragino Sans GB", sans-serif;

/* 字号层级 */
--text-display:  28px/36px 700;  /* 首页统计数字 */
--text-h1:       24px/32px 700;  /* 页面标题 */
--text-h2:       20px/28px 600;  /* 卡片标题 */
--text-h4:       16px/24px 600;  /* 列表项标题 */
--text-body:     14px/22px 400;  /* 正文 */
--text-caption:  12px/18px 400;  /* 标签 */
```

---

## 📐 间距速查

```css
--space-1:  4px;   /* 图标间距 */
--space-2:  8px;   /* 小间距 */
--space-3:  12px;  /* 标准内边距 */
--space-4:  16px;  /* 卡片内边距 */
--space-5:  20px;  /* 页面边距 */
--space-6:  24px;  /* 大间距 */
--space-8:  32px;  /* 区块间距 */
```

### 常用组合
| 元素 | 尺寸 |
|------|------|
| 页面左右边距 | 20px |
| 卡片内边距 | 16px |
| 卡片圆角 | 20px |
| 按钮高度 | 48px |
| 按钮圆角 | 40px (full) |
| 列表项高度 | 56px |
| 导航栏高度 | 52px |
| TabBar高度 | 70px |
| 状态栏高度 | 44px |

---

## 🧩 组件速查

### 主按钮
```css
.btn-primary {
  height: 48px;
  background: #2D6EE0;
  color: white;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 600;
  padding: 14px 24px;
  box-shadow: 0 10px 20px rgba(45,110,224,0.3);
}
.btn-primary:active {
  background: #1A5FD4;
  transform: scale(0.98);
}
```

### 次要按钮
```css
.btn-secondary {
  height: 44px;
  background: white;
  border: 1.5px solid #2D6EE0;
  color: #2D6EE0;
  border-radius: 40px;
  font-size: 15px;
  font-weight: 600;
}
```

### 卡片
```css
.card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  border: 1px solid #F0F2F6;
}
```

### 作文展示框
```css
.writing-box {
  background: #F8FAFF;
  border-radius: 16px;
  padding: 14px;
  border-left: 4px solid #2D6EE0;
  font-size: 16px;
  line-height: 1.6;
}
```

### 错误标注
```css
.error-mark {
  background: #FFE5E5;
  color: #C03535;
  border-bottom: 2px dashed #FF6B6B;
  font-weight: 500;
  padding: 0 2px;
}
```

### 亮点标注
```css
.highlight-mark {
  background: #E6F7E6;
  color: #1F8B4C;
  border-bottom: 2px solid #4CAF50;
  font-weight: 500;
  padding: 0 2px;
}
```

### 分数徽章
```css
.score-badge {
  background: #0B1B32;
  color: white;
  border-radius: 30px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 600;
}
```

### 提示条
```css
.reminder-bar {
  background: #EEF3FE;
  border-radius: 16px;
  padding: 12px 16px;
  color: #1D3A78;
  font-size: 14px;
}
```

---

## ⏳ Loading 规范

### OCR识别
```
标题: "正在识别作文内容..."
副标题: 动态更新 (定位文字 → 识别手写 → 格式化)
预计时间: 3-5秒
```

### AI批改
```
标题: "AI正在批改作文..."
副标题: 轮播 (分析内容 → 检查语法 → 评估词汇 → 提取亮点 → 生成范文)
预计时间: 10-15秒
```

### 字帖生成
```
标题: "正在生成字帖..."
副标题: 轮播 (排版 → 渲染字体 → 生成PDF)
预计时间: 2-3秒
```

---

## 📱 页面跳转表

| 从页面 | 操作 | 到页面 | 参数 |
|--------|------|--------|------|
| 首页 | 点击"拍照批改" | 拍照页 | - |
| 首页 | 点击"查看全部" | 历史记录页 | - |
| 拍照页 | 确认照片 | OCR Loading | imagePath |
| OCR Loading | 识别成功 | AI批改 Loading | ocrText |
| AI批改 Loading | 批改完成 | 批改结果页 | correctionId |
| 批改结果页 | 切换范文级别 | 同页刷新 | level: pass/good/excellent |
| 批改结果页 | 生成字帖 | 字帖Loading | - |
| 字帖Loading | 生成完成 | 字帖预览页 | pdfUrl |
| 底部Tab | 点击"易错点" | 易错点页 | - |
| 易错点页 | 点击分类 | 知识点详情 | categoryId |

---

## ⚠️ 错误码对照

| 错误码 | 含义 | 用户提示 | 处理建议 |
|--------|------|----------|----------|
| E001 | OCR识别失败 | "识别失败，请重新拍摄" | 提供重试/手动输入选项 |
| E002 | 图片模糊 | "图片不够清晰，请重新拍摄" | 提示拍摄技巧 |
| E003 | 非英文内容 | "请拍摄英文作文" | 拒绝处理 |
| E101 | AI服务繁忙 | "批改服务繁忙，请稍后" | 自动重试 |
| E102 | 请求超时 | "请求超时，请检查网络" | 重试按钮 |
| E103 | 内容违规 | "内容不符合规范" | 提示修改 |
| E201 | PDF生成失败 | "字帖生成失败，请重试" | 重试按钮 |
| E301 | 无网络连接 | "网络连接失败" | 检查网络设置 |
| E401 | 相机权限拒绝 | "需要相机权限" | 引导设置 |
| E402 | 存储权限拒绝 | "需要存储权限" | 引导设置 |

---

## 📊 图标对照

| 功能 | Font Awesome 类名 | 类型 |
|------|-------------------|------|
| 首页 | `fa-house` | regular |
| 批改 | `fa-pen-to-square` | regular |
| 易错点 | `fa-circle-exclamation` | regular |
| 亮点库 | `fa-star` | regular |
| 拍照 | `fa-camera` | solid |
| 相册 | `fa-images` | regular |
| 下载 | `fa-circle-down` | regular |
| 打印 | `fa-print` | solid |
| 分享 | `fa-share-nodes` | solid |
| 返回 | `fa-chevron-left` | solid |
| 更多 | `fa-ellipsis-vertical` | solid |
| 成功 | `fa-circle-check` | regular |
| 警告 | `fa-triangle-exclamation` | solid |
| 错误 | `fa-circle-xmark` | regular |
| 灯泡 | `fa-lightbulb` | solid |
| PDF | `fa-file-lines` | regular |
| 日历 | `fa-calendar` | regular |
| 设置 | `fa-gear` | solid |
| 删除 | `fa-trash` | regular |
| 编辑 | `fa-pen` | solid |

---

## 🔧 尺寸参考 (iPhone标准)

```
屏幕宽度: 375px
屏幕高度: 812px (iPhone X及以上)

安全区域:
  - 顶部: 44px (状态栏+刘海)
  - 底部: 34px (Home Indicator)

可用内容高度: 812 - 44 - 34 = 734px

组件尺寸:
  - 状态栏: 44px
  - 导航栏: 52px
  - 内容区: 自动填充
  - TabBar: 70px
```

---

## 📝 提交检查清单

- [ ] 颜色使用设计系统Token，无硬编码色值
- [ ] 字体使用规范层级，无随机字号
- [ ] 间距使用space token (4/8/12/16/20/24/32)
- [ ] 圆角使用radius token (8/12/16/20/full)
- [ ] 按钮有active/pressed状态
- [ ] 列表项有loading/empty/error状态
- [ ] 图片有加载占位和失败处理
- [ ] 所有Toast提示有自动消失逻辑
- [ ] 页面有返回键处理 (Android物理返回)
- [ ] 输入框有焦点管理和键盘适配

---

*文档版本: v1.0*
*更新日期: 2026-03-16*
*作者: UX Design Agent*
