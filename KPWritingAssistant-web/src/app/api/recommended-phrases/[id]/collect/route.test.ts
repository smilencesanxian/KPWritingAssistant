/**
 * @jest-environment node
 */

import { POST } from './route';
import { collectPhrase, isCollected, getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock the database and supabase modules
jest.mock('@/lib/db/recommended-phrases');
jest.mock('@/lib/supabase/server');

const mockedCollectPhrase = collectPhrase as jest.MockedFunction<typeof collectPhrase>;
const mockedIsCollected = isCollected as jest.MockedFunction<typeof isCollected>;
const mockedGetRecommendedPhrases = getRecommendedPhrases as jest.MockedFunction<typeof getRecommendedPhrases>;
const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('POST /api/recommended-phrases/[id]/collect', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockPhrase = {
    id: 'phrase-123',
    text: 'I am writing to...',
    type: 'phrase' as const,
    essay_type: 'email',
    topic_tags: ['formal'],
    usage_example: 'I am writing to inquire about...',
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01T00:00:00Z',
  };
  const mockHighlight = {
    id: 'highlight-123',
    user_id: 'user-123',
    text: 'I am writing to...',
    type: 'phrase',
    source: 'system',
    recommended_phrase_id: 'phrase-123',
    source_submission_id: null,
    created_at: '2024-01-01T00:00:00Z',
  };

  const createMockSupabase = (user: typeof mockUser | null) => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(null) as unknown as ReturnType<typeof createClient>);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(mockedCollectPhrase).not.toHaveBeenCalled();
    });

    it('should proceed when user is authenticated', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([mockPhrase]);
      mockedIsCollected.mockResolvedValue(false);
      mockedCollectPhrase.mockResolvedValue(mockHighlight);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });

      expect(response.status).toBe(201);
      expect(mockedCollectPhrase).toHaveBeenCalledWith({
        userId: 'user-123',
        phraseId: 'phrase-123',
        text: 'I am writing to...',
        type: 'phrase',
      });
    });
  });

  describe('Phrase Validation', () => {
    it('should return 404 when phrase does not exist', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/non-existent/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Recommended phrase not found');
      expect(mockedCollectPhrase).not.toHaveBeenCalled();
    });

    it('should return 400 when phrase ID is missing', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases//collect');
      const response = await POST(request, { params: Promise.resolve({ id: '' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Phrase ID is required');
    });
  });

  describe('Idempotency', () => {
    it('should return 201 for first-time collection', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([mockPhrase]);
      mockedIsCollected.mockResolvedValue(false);
      mockedCollectPhrase.mockResolvedValue(mockHighlight);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.highlight).toEqual(mockHighlight);
      expect(mockedIsCollected).toHaveBeenCalledWith('user-123', 'phrase-123');
    });

    it('should return 200 for duplicate collection (idempotency)', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([mockPhrase]);
      mockedIsCollected.mockResolvedValue(true);
      mockedCollectPhrase.mockResolvedValue(mockHighlight);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.highlight).toEqual(mockHighlight);
      expect(mockedIsCollected).toHaveBeenCalledWith('user-123', 'phrase-123');
    });
  });

  describe('Data Persistence', () => {
    it('should pass correct data to collectPhrase', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([mockPhrase]);
      mockedIsCollected.mockResolvedValue(false);
      mockedCollectPhrase.mockResolvedValue(mockHighlight);

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });

      expect(mockedCollectPhrase).toHaveBeenCalledWith({
        userId: 'user-123',
        phraseId: 'phrase-123',
        text: mockPhrase.text,
        type: mockPhrase.type,
      });
    });

    it('should handle vocabulary type phrases', async () => {
      const vocabPhrase = { ...mockPhrase, id: 'vocab-123', type: 'vocabulary' as const, text: 'sincerely' };
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([vocabPhrase]);
      mockedIsCollected.mockResolvedValue(false);
      mockedCollectPhrase.mockResolvedValue({ ...mockHighlight, type: 'vocabulary', text: 'sincerely' });

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/vocab-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'vocab-123' }) });

      expect(response.status).toBe(201);
      expect(mockedCollectPhrase).toHaveBeenCalledWith({
        userId: 'user-123',
        phraseId: 'vocab-123',
        text: 'sincerely',
        type: 'vocabulary',
      });
    });

    it('should handle sentence type phrases', async () => {
      const sentencePhrase = { ...mockPhrase, id: 'sentence-123', type: 'sentence' as const, text: 'I look forward to hearing from you.' };
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([sentencePhrase]);
      mockedIsCollected.mockResolvedValue(false);
      mockedCollectPhrase.mockResolvedValue({ ...mockHighlight, type: 'sentence', text: 'I look forward to hearing from you.' });

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/sentence-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'sentence-123' }) });

      expect(response.status).toBe(201);
      expect(mockedCollectPhrase).toHaveBeenCalledWith({
        userId: 'user-123',
        phraseId: 'sentence-123',
        text: 'I look forward to hearing from you.',
        type: 'sentence',
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when collectPhrase throws error', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockResolvedValue([mockPhrase]);
      mockedIsCollected.mockResolvedValue(false);
      mockedCollectPhrase.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('收藏失败');
    });

    it('should return 500 when getRecommendedPhrases throws error', async () => {
      mockedCreateClient.mockResolvedValue(createMockSupabase(mockUser) as unknown as ReturnType<typeof createClient>);
      mockedGetRecommendedPhrases.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/recommended-phrases/phrase-123/collect');
      const response = await POST(request, { params: Promise.resolve({ id: 'phrase-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('收藏失败');
    });
  });
});
