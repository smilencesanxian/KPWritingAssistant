import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// ─── GET /api/recommended-phrases 测试 ────────────────────────────────────────

test.describe('GET /api/recommended-phrases', () => {
  test('无需认证即可访问', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
  });

  test('支持 type 查询参数过滤 (vocabulary)', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?type=vocabulary`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    // All returned phrases should be of type 'vocabulary'
    for (const essayType in data.phrases) {
      for (const phrase of data.phrases[essayType]) {
        expect(phrase.type).toBe('vocabulary');
      }
    }
  });

  test('支持 type 查询参数过滤 (phrase)', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?type=phrase`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    for (const essayType in data.phrases) {
      for (const phrase of data.phrases[essayType]) {
        expect(phrase.type).toBe('phrase');
      }
    }
  });

  test('支持 type 查询参数过滤 (sentence)', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?type=sentence`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    for (const essayType in data.phrases) {
      for (const phrase of data.phrases[essayType]) {
        expect(phrase.type).toBe('sentence');
      }
    }
  });

  test('支持 essay_type 查询参数过滤 (email)', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?essay_type=email`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    // Should only contain email phrases (and general ones with null essay_type)
    for (const essayType in data.phrases) {
      expect(['email', 'general']).toContain(essayType);
    }
  });

  test('支持 essay_type 查询参数过滤 (article)', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?essay_type=article`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    for (const essayType in data.phrases) {
      expect(['article', 'general']).toContain(essayType);
    }
  });

  test('支持组合 type 和 essay_type 查询参数', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?type=phrase&essay_type=email`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    for (const essayType in data.phrases) {
      for (const phrase of data.phrases[essayType]) {
        expect(phrase.type).toBe('phrase');
      }
    }
  });

  test('返回数据按 essay_type 分组', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');
    expect(typeof data.phrases).toBe('object');

    // Each key should be an essay_type
    for (const essayType in data.phrases) {
      expect(Array.isArray(data.phrases[essayType])).toBe(true);
      for (const phrase of data.phrases[essayType]) {
        // Phrases with null essay_type are grouped under 'general'
        if (essayType === 'general') {
          expect(phrase.essay_type).toBeNull();
        } else {
          expect(phrase.essay_type).toBe(essayType);
        }
      }
    }
  });

  test('无效的 type 参数返回 400', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?type=invalid`);
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid type parameter');
  });

  test('无效的 essay_type 参数返回 400', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases?essay_type=invalid`);
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid essay_type parameter');
  });

  test('返回的 phrase 对象包含所需字段', async ({ request }) => {
    const response = await request.get(`${BASE}/api/recommended-phrases`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('phrases');

    // Find at least one phrase to check structure
    let foundPhrase = null;
    for (const essayType in data.phrases) {
      if (data.phrases[essayType].length > 0) {
        foundPhrase = data.phrases[essayType][0];
        break;
      }
    }

    if (foundPhrase) {
      expect(foundPhrase).toHaveProperty('id');
      expect(foundPhrase).toHaveProperty('text');
      expect(foundPhrase).toHaveProperty('type');
      expect(foundPhrase).toHaveProperty('essay_type');
      expect(foundPhrase).toHaveProperty('usage_example');
      expect(foundPhrase).toHaveProperty('is_active');
    }
  });
});

// ─── POST /api/recommended-phrases/[id]/collect 测试 ───────────────────────────

test.describe('POST /api/recommended-phrases/[id]/collect', () => {
  test('未登录时返回 401', async ({ request }) => {
    const response = await request.post(`${BASE}/api/recommended-phrases/some-id/collect`);
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Unauthorized');
  });

  test('登录后首次收藏返回 201', async ({ browser }) => {
    // Create a new context with authentication bypass
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'x-e2e-user-id',
        value: 'e2e-test-user',
        domain: 'localhost',
        path: '/',
      }
    ]);

    const request = context.request;

    // First, get a valid phrase ID
    const getResponse = await request.get(`${BASE}/api/recommended-phrases`);
    const { phrases } = await getResponse.json();

    // Find first available phrase
    let phraseId = null;
    for (const essayType in phrases) {
      if (phrases[essayType].length > 0) {
        phraseId = phrases[essayType][0].id;
        break;
      }
    }

    if (!phraseId) {
      test.skip(true, 'No phrases available in database');
      return;
    }

    // Try to collect the phrase
    const response = await request.post(`${BASE}/api/recommended-phrases/${phraseId}/collect`);

    // Could be 201 (new) or 200 (already exists from previous test)
    expect([200, 201]).toContain(response.status());

    const data = await response.json();
    expect(data).toHaveProperty('highlight');
    expect(data.highlight).toHaveProperty('id');
    expect(data.highlight).toHaveProperty('text');
    expect(data.highlight).toHaveProperty('type');
    expect(data.highlight).toHaveProperty('source', 'system');
    expect(data.highlight).toHaveProperty('recommended_phrase_id', phraseId);

    await context.close();
  });

  test('重复收藏返回 200 (幂等性)', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'x-e2e-user-id',
        value: 'e2e-test-user-idempotent',
        domain: 'localhost',
        path: '/',
      }
    ]);

    const request = context.request;

    // Get a valid phrase ID
    const getResponse = await request.get(`${BASE}/api/recommended-phrases`);
    const { phrases } = await getResponse.json();

    let phraseId = null;
    for (const essayType in phrases) {
      if (phrases[essayType].length > 0) {
        phraseId = phrases[essayType][0].id;
        break;
      }
    }

    if (!phraseId) {
      test.skip(true, 'No phrases available in database');
      return;
    }

    // First collection
    const firstResponse = await request.post(`${BASE}/api/recommended-phrases/${phraseId}/collect`);
    expect([200, 201]).toContain(firstResponse.status());

    // Second collection (should be idempotent)
    const secondResponse = await request.post(`${BASE}/api/recommended-phrases/${phraseId}/collect`);
    expect(secondResponse.status()).toBe(200);

    const data = await secondResponse.json();
    expect(data).toHaveProperty('highlight');

    await context.close();
  });

  test('不存在的 phrase ID 返回 404', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'x-e2e-user-id',
        value: 'e2e-test-user',
        domain: 'localhost',
        path: '/',
      }
    ]);

    const request = context.request;

    const response = await request.post(`${BASE}/api/recommended-phrases/non-existent-id/collect`);
    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Recommended phrase not found');

    await context.close();
  });
});
