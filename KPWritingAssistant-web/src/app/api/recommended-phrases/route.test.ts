/**
 * @jest-environment node
 */

import { GET } from './route';
import { getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { NextRequest } from 'next/server';

// Mock the database module
jest.mock('@/lib/db/recommended-phrases');

// Mock supabase server client to avoid cookies() request-scope error
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      }),
    },
  }),
}));

const mockedGetRecommendedPhrases = getRecommendedPhrases as jest.MockedFunction<typeof getRecommendedPhrases>;

describe('GET /api/recommended-phrases', () => {
  const mockPhrases = [
    {
      id: 'phrase-1',
      text: 'I am writing to...',
      type: 'phrase' as const,
      essay_type: 'email',
      topic_tags: ['formal'],
      usage_example: 'I am writing to inquire about...',
      is_active: true,
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'phrase-2',
      text: 'Looking forward to...',
      type: 'phrase' as const,
      essay_type: 'email',
      topic_tags: ['formal'],
      usage_example: 'Looking forward to hearing from you.',
      is_active: true,
      sort_order: 2,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'phrase-3',
      text: 'In conclusion',
      type: 'phrase' as const,
      essay_type: 'article',
      topic_tags: ['writing'],
      usage_example: 'In conclusion, I believe that...',
      is_active: true,
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'phrase-4',
      text: 'sincerely',
      type: 'vocabulary' as const,
      essay_type: null,
      topic_tags: ['formal'],
      usage_example: 'Yours sincerely',
      is_active: true,
      sort_order: 1,
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Happy Path', () => {
    it('should return all phrases grouped by essay_type (no filters)', async () => {
      mockedGetRecommendedPhrases.mockResolvedValue(mockPhrases);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phrases).toBeDefined();
      expect(data.phrases.email).toHaveLength(2);
      expect(data.phrases.article).toHaveLength(1);
      expect(data.phrases.general).toHaveLength(1);
      // searchParams.get returns null when param is not present
      expect(mockedGetRecommendedPhrases).toHaveBeenCalledWith({
        type: null,
        essayType: null,
      });
    });

    it('should return phrases filtered by type=vocabulary', async () => {
      const vocabularyPhrases = mockPhrases.filter(p => p.type === 'vocabulary');
      mockedGetRecommendedPhrases.mockResolvedValue(vocabularyPhrases);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases?type=vocabulary');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phrases.general).toHaveLength(1);
      expect(mockedGetRecommendedPhrases).toHaveBeenCalledWith({
        type: 'vocabulary',
        essayType: null,
      });
    });

    it('should return phrases filtered by essay_type=email', async () => {
      const emailPhrases = mockPhrases.filter(p => p.essay_type === 'email');
      mockedGetRecommendedPhrases.mockResolvedValue(emailPhrases);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases?essay_type=email');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phrases.email).toHaveLength(2);
      expect(mockedGetRecommendedPhrases).toHaveBeenCalledWith({
        type: null,
        essayType: 'email',
      });
    });

    it('should return phrases filtered by both type and essay_type', async () => {
      const filteredPhrases = mockPhrases.filter(p => p.type === 'phrase' && p.essay_type === 'email');
      mockedGetRecommendedPhrases.mockResolvedValue(filteredPhrases);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases?type=phrase&essay_type=email');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phrases.email).toHaveLength(2);
      expect(mockedGetRecommendedPhrases).toHaveBeenCalledWith({
        type: 'phrase',
        essayType: 'email',
      });
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for invalid type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/recommended-phrases?type=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid type parameter');
      expect(mockedGetRecommendedPhrases).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid essay_type parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/recommended-phrases?essay_type=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid essay_type parameter');
      expect(mockedGetRecommendedPhrases).not.toHaveBeenCalled();
    });

    it('should accept all valid type values', async () => {
      mockedGetRecommendedPhrases.mockResolvedValue([]);

      const validTypes = ['vocabulary', 'phrase', 'sentence'];
      for (const type of validTypes) {
        const request = new NextRequest(`http://localhost:3000/api/recommended-phrases?type=${type}`);
        const response = await GET(request);
        expect(response.status).toBe(200);
      }
    });

    it('should accept all valid essay_type values', async () => {
      mockedGetRecommendedPhrases.mockResolvedValue([]);

      const validEssayTypes = ['email', 'article', 'story', 'general'];
      for (const essayType of validEssayTypes) {
        const request = new NextRequest(`http://localhost:3000/api/recommended-phrases?essay_type=${essayType}`);
        const response = await GET(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Data Grouping', () => {
    it('should group phrases with null essay_type under "general"', async () => {
      mockedGetRecommendedPhrases.mockResolvedValue(mockPhrases);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases');
      const response = await GET(request);
      const data = await response.json();

      expect(data.phrases.general).toBeDefined();
      expect(data.phrases.general[0].id).toBe('phrase-4');
    });

    it('should return empty object when no phrases found', async () => {
      mockedGetRecommendedPhrases.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.phrases).toEqual({});
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when database throws error', async () => {
      mockedGetRecommendedPhrases.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('获取推荐句式失败');
    });
  });
});
