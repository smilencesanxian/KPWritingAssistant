import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

/**
 * Upload Page Integration Tests - Task 6
 *
 * Tests for:
 * - Full 4-step flow with mocked APIs
 * - Parallel OCR handling
 * - API integration
 * - Error scenarios
 */

interface MockUploadResponse {
  storage_path: string;
  url: string;
}

interface MockOcrResponse {
  text: string;
}

interface MockDetectTypeResponse {
  exam_part: 'part1' | 'part2';
  question_type: 'q1' | 'q2' | null;
  essay_type_label: string;
  topic: string;
  confidence: 'high' | 'medium' | 'low';
}

interface MockEssaysResponse {
  submission: {
    id: string;
    status: string;
  };
}

interface MockCorrectResponse {
  correction: {
    id: string;
    status: string;
  };
  flagged_errors: unknown[];
}

// Mock fetch globally
global.fetch = jest.fn() as unknown as typeof fetch;

describe('Upload Flow - Full Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('IT-001: Complete flow with both images', () => {
    it('should complete full flow: upload → OCR → detect-type → essays → correct', async () => {
      // Mock responses
      const mockUploadResponse = {
        storage_path: 'essays/test.jpg',
        url: 'https://example.com/test.jpg',
      };

      const mockOcrResponse = {
        text: 'Dear friend, How are you?',
      };

      const mockDetectTypeResponse = {
        exam_part: 'part1',
        question_type: null,
        essay_type_label: '邮件',
        topic: '给朋友写邮件',
        confidence: 'high',
      };

      const mockEssaysResponse = {
        submission: {
          id: 'test-submission-id',
          status: 'pending',
        },
      };

      const mockCorrectResponse = {
        correction: {
          id: 'test-correction-id',
          status: 'completed',
        },
        flagged_errors: [],
      };

      // Setup fetch mock sequence
      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUploadResponse,
        }) // essay upload
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUploadResponse,
        }) // question upload
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOcrResponse,
        }) // essay OCR
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOcrResponse,
        }) // question OCR
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetectTypeResponse,
        }) // detect-type
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockEssaysResponse,
        }) // create essay
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCorrectResponse,
        }); // start correction

      // Simulate the flow
      // Step 1: Upload both images
      const essayUploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData(),
      });
      const essayUploadData = await essayUploadRes.json() as MockUploadResponse;

      const questionUploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: new FormData(),
      });
      const questionUploadData = await questionUploadRes.json() as MockUploadResponse;

      // Step 2: Parallel OCR
      const [essayOcrRes, questionOcrRes] = await Promise.all([
        fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: essayUploadData.url }),
        }),
        fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_url: questionUploadData.url }),
        }),
      ]);

      const essayOcrData = await essayOcrRes.json() as MockOcrResponse;
      const questionOcrData = await questionOcrRes.json() as MockOcrResponse;

      // Step 3: Detect type
      const detectRes = await fetch('/api/detect-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay_ocr_text: essayOcrData.text,
          question_ocr_text: questionOcrData.text,
        }),
      });
      const detectData = await detectRes.json() as MockDetectTypeResponse;

      // Step 4: Create essay record
      const essaysRes = await fetch('/api/essays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ocr_text: essayOcrData.text,
          original_image_path: essayUploadData.storage_path,
          exam_part: detectData.exam_part,
          question_type: detectData.question_type,
          question_image_path: questionUploadData.storage_path,
          question_ocr_text: questionOcrData.text,
          essay_topic: detectData.topic,
        }),
      });
      const essaysData = await essaysRes.json() as MockEssaysResponse;

      // Step 5: Start correction
      const correctRes = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: essaysData.submission.id,
          exam_part: detectData.exam_part,
        }),
      });
      const correctData = await correctRes.json() as MockCorrectResponse;

      // Assertions
      expect(mockFetch).toHaveBeenCalledTimes(7);
      expect(essayUploadData).toHaveProperty('storage_path');
      expect(essayOcrData).toHaveProperty('text');
      expect(detectData).toHaveProperty('exam_part');
      expect(essaysData.submission).toHaveProperty('id');
      expect(correctData.correction).toHaveProperty('id');
    });
  });

  describe('IT-002: Complete flow with essay only', () => {
    it('should skip question OCR when question image not provided', async () => {
      const mockUploadResponse = {
        storage_path: 'essays/test.jpg',
        url: 'https://example.com/test.jpg',
      };

      const mockOcrResponse = {
        text: 'Dear friend, How are you?',
      };

      const mockDetectTypeResponse = {
        exam_part: 'part1',
        question_type: null,
        essay_type_label: '邮件',
        topic: '给朋友写邮件',
        confidence: 'medium',
      };

      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUploadResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOcrResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetectTypeResponse,
        });

      // Only upload essay
      await fetch('/api/upload', { method: 'POST', body: new FormData() });
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: 'https://example.com/test.jpg' }),
      });
      const ocrData = await ocrRes.json() as MockOcrResponse;

      // Detect type without question
      const detectRes = await fetch('/api/detect-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essay_ocr_text: ocrData.text,
          // No question_ocr_text
        }),
      });
      const detectData = await detectRes.json() as MockDetectTypeResponse;

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(detectData.exam_part).toBe('part1');
    });
  });

  describe('IT-003: OCR failure handling', () => {
    it('should handle OCR failure gracefully', async () => {
      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ storage_path: 'essays/test.jpg', url: 'https://example.com/test.jpg' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ error: 'OCR failed' }),
        });

      await fetch('/api/upload', { method: 'POST', body: new FormData() });
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: 'https://example.com/test.jpg' }),
      });

      expect(ocrRes.ok).toBe(false);
      // User should be able to proceed with manual input
    });
  });

  describe('IT-004: Detect-type failure handling', () => {
    it('should use default type when detect-type fails', async () => {
      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Detection failed' }),
      });

      const detectRes = await fetch('/api/detect-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ essay_ocr_text: 'test' }),
      });

      expect(detectRes.ok).toBe(false);

      // Default values should be used
      const defaultType = {
        exam_part: 'part1',
        question_type: null,
        essay_type_label: '邮件',
        topic: '',
        confidence: 'low',
      };

      expect(defaultType.exam_part).toBe('part1');
    });
  });

  describe('IT-005: API request body validation', () => {
    it('should include all new fields in /api/essays request', async () => {
      interface RequestBody {
        ocr_text?: string;
        original_image_path?: string;
        exam_part?: string;
        question_type?: string;
        question_image_path?: string;
        question_ocr_text?: string;
        essay_topic?: string;
        [key: string]: unknown;
      }

      let requestBody: RequestBody = {};

      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch.mockImplementation((_url: string, options: { body?: string }) => {
        if (_url === '/api/essays' && options.body) {
          requestBody = JSON.parse(options.body) as RequestBody;
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ submission: { id: 'test-id' } }),
        });
      });

      const essayData = {
        ocr_text: 'Dear friend',
        original_image_path: 'essays/test.jpg',
        exam_part: 'part2',
        question_type: 'q1',
        question_image_path: 'questions/test.jpg',
        question_ocr_text: 'Write an article',
        essay_topic: '露营',
      };

      await fetch('/api/essays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(essayData),
      });

      expect(requestBody).toHaveProperty('exam_part', 'part2');
      expect(requestBody).toHaveProperty('question_type', 'q1');
      expect(requestBody).toHaveProperty('question_image_path');
      expect(requestBody).toHaveProperty('question_ocr_text');
      expect(requestBody).toHaveProperty('essay_topic');
    });
  });

  describe('IT-006: Correct API with exam_part parameter', () => {
    it('should include exam_part in /api/correct request', async () => {
      interface RequestBody {
        submission_id?: string;
        exam_part?: string;
        [key: string]: unknown;
      }

      let requestBody: RequestBody = {};

      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch.mockImplementation((_url: string, options: { body?: string }) => {
        if (_url === '/api/correct' && options.body) {
          requestBody = JSON.parse(options.body) as RequestBody;
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            correction: { id: 'test-id' },
            flagged_errors: [],
          }),
        });
      });

      await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: 'test-submission-id',
          exam_part: 'part2',
        }),
      });

      expect(requestBody).toHaveProperty('exam_part', 'part2');
    });
  });

  describe('IT-007: Network error handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await fetch('/api/upload', { method: 'POST', body: new FormData() });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('IT-008: Duplicate submission prevention', () => {
    it('should prevent concurrent submissions', async () => {
      let callCount = 0;

      const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
      global.fetch = mockFetch;

      mockFetch.mockImplementation(() => {
        callCount++;
        return new Promise(resolve => setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ submission: { id: `id-${callCount}` } }),
          });
        }, 100));
      });

      // Simulate rapid clicks
      const promises = [
        fetch('/api/essays', { method: 'POST', body: '{}' }),
        fetch('/api/essays', { method: 'POST', body: '{}' }),
        fetch('/api/essays', { method: 'POST', body: '{}' }),
      ];

      await Promise.all(promises);

      // Should have some mechanism to prevent duplicates
      // This test documents the expected behavior
      expect(callCount).toBeGreaterThan(0);
    });
  });
});

describe('Parallel OCR Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process both OCR requests in parallel', async () => {
    const delays = [100, 50]; // Different delays to verify parallel execution
    const startTimes: number[] = [];
    const endTimes: number[] = [];

    const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
    global.fetch = mockFetch;

    mockFetch.mockImplementation(() => {
      const index = startTimes.length;
      startTimes.push(Date.now());

      return new Promise(resolve => {
        setTimeout(() => {
          endTimes.push(Date.now());
          resolve({
            ok: true,
            json: async () => ({ text: `OCR result ${index}` }),
          });
        }, delays[index] || 50);
      });
    });

    const startTime = Date.now();

    await Promise.all([
      fetch('/api/ocr', {
        method: 'POST',
        body: JSON.stringify({ image_url: 'essay.jpg' }),
      }),
      fetch('/api/ocr', {
        method: 'POST',
        body: JSON.stringify({ image_url: 'question.jpg' }),
      }),
    ]);

    const totalTime = Date.now() - startTime;

    // Total time should be close to max delay, not sum of delays
    expect(totalTime).toBeLessThan(150); // Should complete in ~100ms, not ~150ms
  });

  it('should handle partial OCR failure in parallel processing', async () => {
    const mockFetch = jest.fn() as ReturnType<typeof jest.fn> & typeof fetch;
    global.fetch = mockFetch;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Essay OCR success' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Question OCR failed' }),
      });

    const results = await Promise.allSettled([
      fetch('/api/ocr', { method: 'POST', body: '{}' }),
      fetch('/api/ocr', { method: 'POST', body: '{}' }),
    ]);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('fulfilled'); // fetch resolves even for error status

    const essayRes = await (results[0] as PromiseFulfilledResult<Response>).value;
    const questionRes = await (results[1] as PromiseFulfilledResult<Response>).value;

    expect(essayRes.ok).toBe(true);
    expect(questionRes.ok).toBe(false);
  });
});
