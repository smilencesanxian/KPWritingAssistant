import { recognizeHandwriting } from './tal';

describe('recognizeHandwriting (TAL OCR)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.TAL_ACCESS_KEY_ID = 'test-access-key-id';
    process.env.TAL_ACCESS_KEY_SECRET = 'test-access-key-secret';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
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

  it('should handle API error response', async () => {
    const mockResponse = {
      code: 4010101,
      msg: '请求未授权',
      requestId: 'test-request-id',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '图片识别失败：请求未授权'
    );
  });

  it('should handle HTTP error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(recognizeHandwriting('base64image')).rejects.toThrow(
      '图片识别失败，请检查图片清晰度后重试'
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
              { char: 'H', pos: [{ x: 0, y: 0 }] },
              { char: 'i', pos: [{ x: 10, y: 0 }] },
            ],
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('Hi');
    expect(result.confidence).toBe(0.85);
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
            poses: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
            texts: '印刷体文字',
          },
        ],
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('印刷体文字');
    expect(result.confidence).toBe(0.85);
  });

  it('should handle empty data response', async () => {
    const mockResponse = {
      code: 20000,
      msg: '成功',
      requestId: 'test-request-id',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await recognizeHandwriting('base64image');

    expect(result.text).toBe('');
    expect(result.confidence).toBe(0);
  });
});
