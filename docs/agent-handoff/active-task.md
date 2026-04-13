# 当前任务

最后更新：2026-04-13

## 状态

`completed`

## 当前负责方

`claude-code`

## 目标

新增好未来(学而思) OCR 识别接口支持，作为现有 OCR 能力的扩展选项。

## 主要工作区域

`KPWritingAssistant-web/`

## 已完成的文件

- `KPWritingAssistant-web/src/lib/ocr/tal.ts` - 好未来 OCR 实现
- `KPWritingAssistant-web/src/lib/ocr/tal.test.ts` - 单元测试
- `KPWritingAssistant-web/src/lib/ocr/index.ts` - 添加 tal 选项
- `KPWritingAssistant-web/.env.local.example` - 添加环境变量配置

## 变更详情

### 1. 新增好未来 OCR 实现 (src/lib/ocr/tal.ts)

实现了 `recognizeHandwriting` 函数，支持好未来 AI 开放平台的手写文字识别 API：

- **API 地址**: `https://openai.100tal.com/aiimage/comeducation`
- **鉴权方式**: HmacSHA1 签名，通过 URL 参数传递
- **签名参数**:
  - `access_key_id`: 应用 Access Key ID
  - `timestamp`: 13位 UNIX 时间戳
  - `signature_nonce`: 随机 UUID
  - `signature`: HmacSHA1 签名结果 (Base64)
- **请求体参数**:
  - `image_base64`: 图片 Base64 编码
  - `function`: 2 (手写文字识别)
  - `detect_direction`: true (检测图片方向)
  - `subject`: 'liberat' (文科)
  - `textInImage`: true (输出图片中的文字)

### 2. 响应处理逻辑

优先返回手写文本识别结果，按以下优先级处理：
1. `hand_text` - 手写文本框识别结果
2. `result` - 通用识别结果 (按字符拼接)
3. `print_text` - 印刷体文本 (备用)

### 3. 配置方式

在 `.env.local` 中配置：

```bash
# 切换 OCR 提供商为好未来
OCR_PROVIDER=tal

# 好未来 OCR 密钥 (在控制台 -> 应用管理中创建应用获取)
TAL_ACCESS_KEY_ID=your_tal_access_key_id
TAL_ACCESS_KEY_SECRET=your_tal_access_key_secret
```

## 验证情况

- `npm test -- --runInBand src/lib/ocr/tal.test.ts`: 通过，9 个测试全部通过
- `npm test -- --runInBand src/lib/ocr/`: 通过，26 个测试全部通过
- `npm run lint`: 通过，0 error (13 个 warning 为既有)
- `npm run build`: 通过

## 已知阻塞

- 无功能阻塞
- 需要用户提供真实的好未来 API 密钥才能实际测试

## 下一位 Agent 的第一步

如需使用好未来 OCR：

1. 在好未来 AI 开放平台 (https://ai.100tal.com) 创建应用
2. 获取 `Access Key ID` 和 `Access Key Secret`
3. 在 `.env.local` 中配置上述密钥并设置 `OCR_PROVIDER=tal`
4. 重启开发服务器测试图片上传识别功能

## 参考文档

- 好未来 AI 开放平台: https://ai.100tal.com/product/ocr-hr
- 鉴权文档: `docs/sugession&issues/好未来API调用文档-HTTP-HTTPS鉴权.mhtml`
- 通用 OCR 接口文档: `docs/sugession&issues/好未来通用OCR接口文档.mhtml`
