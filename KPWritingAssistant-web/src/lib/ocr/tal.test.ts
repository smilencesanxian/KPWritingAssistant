import crypto from 'crypto';
import { recognizeHandwriting } from './tal';

describe('recognizeHandwriting (TAL OCR)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    process.env = { ...originalEnv };
    process.env.TAL_ACCESS_KEY_ID = 'test-access-key-id';
    process.env.TAL_ACCESS_KEY_SECRET = 'test-access-key-secret';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should throw error when TAL_ACCESS_KEY_ID is not configured', async () => {
    delete process.env.TAL_ACCESS_KEY_ID;

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '好未来 OCR 密钥未配置'
    );
  });

  it('should throw error when TAL_ACCESS_KEY_SECRET is not configured', async () => {
    delete process.env.TAL_ACCESS_KEY_SECRET;

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '好未来 OCR 密钥未配置'
    );
  });

  it('should successfully recognize handwriting text', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
      data: {
        rotate: 0,
        hand_text: [
          {
            poses: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
            texts: ['Hello world'],
          },
          {
            poses: [{ x: 0, y: 60 }, { x: 100, y: 60 }, { x: 100, y: 110 }, { x: 0, y: 110 }],
            texts: ['第二行文字'],
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 20000,
        msg: '成功',
        requestId: 'fallback-empty-data',
      }),
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('Hello world\n第二行文字');
    expect(result.confidence).toBe(0.85);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Verify request URL contains required parameters
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const url = fetchCall[0];
    expect(url).toContain('access_key_id=test-access-key-id');
    expect(url).toContain('timestamp=');
    expect(url).toContain('signature=');

    // Verify request body
    const options = fetchCall[1];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(options.body);
    expect(body.image_base64).toBe('base64image');
    expect(body.function).toBe(2);
    expect(body.detect_direction).toBe(true);
    expect(body.subject).toBe('liberat');
    expect(body.textInImage).toBe(true);
  });

  it('should sign request with sorted params and URL-encode signature', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1713000000000);
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(
      '00000000-0000-4000-8000-000000000002'
    );

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 20000,
        msg: '成功',
        requestId: 'test-request-id',
        data: {
          hand_text: [
            {
              poses: [{ x: 0, y: 0 }],
              texts: ['signed text'],
            },
          ],
        },
      }),
    });

    await recognizeHandwriting('base64image');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.stringify({
      image_base64: 'base64image',
      function: 2,
      detect_direction: true,
      subject: 'liberat',
      textInImage: true,
    });
    const stringToSign = [
      'access_key_id=test-access-key-id',
      `request_body=${requestBody}`,
      'signature_nonce=00000000-0000-4000-8000-000000000002',
      'timestamp=1713000000000',
    ].join('&');
    const expectedSignature = crypto
      .createHmac('sha1', 'test-access-key-secret&')
      .update(stringToSign, 'utf-8')
      .digest('base64');
    const encodedSignature = encodeURIComponent(expectedSignature);

    expect(url).toContain(`signature=${encodedSignature}`);
    expect(url).not.toContain(`signature=${expectedSignature}`);

    const parsedUrl = new URL(url);
    expect(parsedUrl.searchParams.get('access_key_id')).toBe('test-access-key-id');
    expect(parsedUrl.searchParams.get('signature')).toBe(expectedSignature);
    expect(parsedUrl.searchParams.get('signature_nonce')).toBe(
      '00000000-0000-4000-8000-000000000002'
    );
    expect(parsedUrl.searchParams.get('timestamp')).toBe('1713000000000');
    expect(parsedUrl.search).toBe(
      `?access_key_id=test-access-key-id&signature=${encodedSignature}&signature_nonce=00000000-0000-4000-8000-000000000002&timestamp=1713000000000`
    );
  });

  it('should handle API error response', async () => {
    const mockResponse = {
      code: 4010101,
      msg: '请求未授权',
      requestId: 'test-request-id',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 20000,
        msg: '成功',
        requestId: 'fallback-empty',
        data: {
          print_text: [],
        },
      }),
    });

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '图片识别失败：请求未授权'
    );
  });

  it('should handle HTTP error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '',
    });

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '图片识别失败，请检查图片清晰度后重试'
    );
  });

  it('should retry when TAL returns QPS limit error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () =>
          JSON.stringify({
            code: 4011005,
            msg: '用户下接口QPS达到上限，无法调用此接口',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 20000,
          msg: '成功',
          requestId: 'retry-success',
          data: {
            hand_text: [
              {
                poses: [{ x: 0, y: 0 }],
                texts: ['retry success'],
              },
            ],
          },
        }),
      });

    const promise = recognizeHandwriting('base64image');
    await jest.advanceTimersByTimeAsync(1200);
    const result = await promise;

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.text).toBe('retry success');
  });

  it('should surface HTTP error message returned by TAL API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ msg: '请求未授权' }),
    });

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '图片识别失败：请求未授权'
    );
  });

  it('should return empty text when no hand_text in response', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
      data: {
        rotate: 0,
        hand_text: [],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: 20000,
        msg: '成功',
        requestId: 'fallback-empty',
      }),
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
  });

  it('should fallback to result field when hand_text is empty', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
      data: {
        rotate: 0,
        hand_text: [],
        result: [
          {
            char_info: [
              { char: 'i', pos: [{ x: 10, y: 0 }] },
              { char: 'H', pos: [{ x: 0, y: 0 }] },
            ],
          },
        ],
      },
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 20000,
          msg: '成功',
          requestId: 'fallback-empty-data',
        }),
      });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('Hi');
    expect(result.confidence).toBe(0.85);
  });

  it('should fallback to function=0 when handwriting mode returns no text', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 20000,
          msg: '成功',
          requestId: 'handwriting-empty',
          data: {
            hand_text: [],
            result: [],
            print_text: [],
            single_box: {
              row_text: [
                {
                  poses: [{ x: 0, y: 0 }],
                  texts: [''],
                },
              ],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 20000,
          msg: '成功',
          requestId: 'general-success',
          data: {
            print_text: [
              {
                poses: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
                texts: 'Printed line',
              },
            ],
          },
        }),
      });

    const result = await recognizeHandwriting('base64image');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const secondBody = JSON.parse((global.fetch as jest.Mock).mock.calls[1][1].body);
    expect(firstBody.function).toBe(2);
    expect(secondBody.function).toBe(0);
    expect(result.text).toBe('Printed line');
  });

  it('should sort hand_text blocks by reading order instead of API order', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
      data: {
        hand_text: [
          {
            poses: [{ x: 0, y: 60 }, { x: 100, y: 60 }, { x: 100, y: 110 }, { x: 0, y: 110 }],
            texts: ['第二行文字'],
          },
          {
            poses: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
            texts: ['第一行文字'],
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('第一行文字\n第二行文字');
  });

  it('should fallback to print_text when other fields are empty', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
      data: {
        rotate: 0,
        print_text: [
          {
            poses: [{ x: 0, y: 60 }, { x: 100, y: 60 }, { x: 100, y: 110 }, { x: 0, y: 110 }],
            texts: '第二行印刷体',
          },
          {
            poses: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
            texts: '第一行印刷体',
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('第一行印刷体\n第二行印刷体');
    expect(result.confidence).toBe(0.85);
  });

  it('should fallback to single_box.row_text when other text fields are empty', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
      data: {
        single_box: {
          row_text: [
            {
              poses: [{ x: 0, y: 60 }, { x: 100, y: 60 }, { x: 100, y: 110 }, { x: 0, y: 110 }],
              texts: ['第二行'],
            },
            {
              poses: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
              texts: ['第一行'],
            },
          ],
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('第一行\n第二行');
    expect(result.confidence).toBe(0.85);
  });

  it('should handle empty data response', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 20000,
          msg: '成功',
          requestId: 'fallback-empty-data',
        }),
      });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
  });
});
