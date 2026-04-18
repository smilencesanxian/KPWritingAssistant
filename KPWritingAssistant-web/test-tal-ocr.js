import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const TAL_OCR_URL = 'https://openai.100tal.com/aiimage/comeducation';
const TEST_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+H+AHGG1YHq8AAAABJRU5ErkJggg==';

function buildUrlParams(params) {
  return Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function generateSignature(urlParams, requestBody, accessKeySecret) {
  const signParam = {
    access_key_id: urlParams.access_key_id,
    request_body: requestBody,
    signature_nonce: urlParams.signature_nonce,
    timestamp: urlParams.timestamp,
  };
  const stringToSign = Object.keys(signParam)
    .sort()
    .map((key) => `${key}=${signParam[key]}`)
    .join('&');

  return crypto
    .createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign, 'utf-8')
    .digest('base64');
}

function loadImageBase64() {
  const imagePath = process.argv[2];
  if (!imagePath) {
    return TEST_IMAGE_BASE64;
  }

  const absolutePath = path.resolve(process.cwd(), imagePath);
  return fs.readFileSync(absolutePath).toString('base64');
}

async function main() {
  const accessKeyId = process.env.TAL_ACCESS_KEY_ID;
  const accessKeySecret = process.env.TAL_ACCESS_KEY_SECRET;

  if (!accessKeyId || !accessKeySecret) {
    throw new Error('缺少 TAL_ACCESS_KEY_ID 或 TAL_ACCESS_KEY_SECRET，请先通过环境变量注入');
  }

  const bodyParams = {
    image_base64: loadImageBase64(),
    function: 2,
    detect_direction: true,
    subject: 'liberat',
    textInImage: true,
  };
  const requestBody = JSON.stringify(bodyParams);
  const urlParams = {
    access_key_id: accessKeyId,
    signature_nonce: crypto.randomUUID(),
    timestamp: Date.now().toString(),
  };
  const url = `${TAL_OCR_URL}?${buildUrlParams({
    ...urlParams,
    signature: generateSignature(urlParams, requestBody, accessKeySecret),
  })}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });
  const resultText = await response.text();

  console.log(JSON.stringify(
    {
      status: response.status,
      ok: response.ok,
      body: resultText,
    },
    null,
    2
  ));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
