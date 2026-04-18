/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from './route';
import { createClient } from '@/lib/supabase/server';
import { updateModelEssay, getUserPreferenceNotes } from '@/lib/db/model-essays';
import { getCollectedSystemPhrases } from '@/lib/db/highlights';
import { getRecommendedPhrases } from '@/lib/db/recommended-phrases';
import { regenerateModelEssay } from '@/lib/ai/llm';
import { generateValidatedModelEssay } from '@/lib/model-essay/generation';
import { buildModelEssaySourceSpans } from '@/lib/model-essay/source-spans';
import { checkRateLimit } from '@/lib/rate-limit';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/db/model-essays');
jest.mock('@/lib/db/highlights');
jest.mock('@/lib/db/recommended-phrases');
jest.mock('@/lib/ai/llm');
jest.mock('@/lib/model-essay/generation');
jest.mock('@/lib/model-essay/source-spans');
jest.mock('@/lib/model-essay/sources', () => ({
  buildModelEssaySourceBuckets: jest.fn().mockReturnValue({
    historicalHighlightTexts: [],
    knowledgeBaseTexts: [],
  }),
  dedupeSourceInputs: jest.fn((items: unknown[]) => items),
  filterPhrasesByKnowledgeEssayType: jest.fn((items: unknown[]) => items),
  getKnowledgeEssayType: jest.fn().mockReturnValue('article'),
}));
jest.mock('@/lib/rate-limit');

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockedUpdateModelEssay = updateModelEssay as jest.MockedFunction<typeof updateModelEssay>;
const mockedGetUserPreferenceNotes = getUserPreferenceNotes as jest.MockedFunction<typeof getUserPreferenceNotes>;
const mockedGetCollectedSystemPhrases = getCollectedSystemPhrases as jest.MockedFunction<typeof getCollectedSystemPhrases>;
const mockedGetRecommendedPhrases = getRecommendedPhrases as jest.MockedFunction<typeof getRecommendedPhrases>;
const mockedRegenerateModelEssay = regenerateModelEssay as jest.MockedFunction<typeof regenerateModelEssay>;
const mockedGenerateValidatedModelEssay = generateValidatedModelEssay as jest.MockedFunction<typeof generateValidatedModelEssay>;
const mockedBuildModelEssaySourceSpans = buildModelEssaySourceSpans as jest.MockedFunction<typeof buildModelEssaySourceSpans>;
const mockedCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;

function createMockSupabase() {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'model_essays') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'essay-1',
              corrections: {
                submission_id: 'submission-1',
                essay_submissions: {
                  user_id: 'user-1',
                  ocr_text: 'original text',
                  exam_part: 'part2',
                  question_type: 'q1',
                },
              },
            },
            error: null,
          }),
        };
      }

      if (table === 'highlights_library') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('POST /api/model-essays/[id]/regenerate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCheckRateLimit.mockReturnValue(true);
    mockedCreateClient.mockResolvedValue(createMockSupabase() as unknown as ReturnType<typeof createClient>);
    mockedGetCollectedSystemPhrases.mockResolvedValue([]);
    mockedGetRecommendedPhrases.mockResolvedValue([]);
    mockedGetUserPreferenceNotes.mockResolvedValue(['old note']);
    mockedRegenerateModelEssay.mockResolvedValue('new content');
    mockedGenerateValidatedModelEssay.mockImplementation(async (generator) => generator(''));
    mockedBuildModelEssaySourceSpans.mockReturnValue([]);
    mockedUpdateModelEssay.mockResolvedValue({
      id: 'essay-1',
      correction_id: 'correction-1',
      target_level: 'excellent',
      content: 'old content',
      created_at: '2026-04-18T00:00:00.000Z',
      user_edited_content: 'new content',
      is_user_edited: true,
      edit_history: [],
      user_preference_notes: 'new note',
      source_spans: [],
    });
  });

  it('returns 200 on successful regenerate flow', async () => {
    const request = new NextRequest('http://localhost:3000/api/model-essays/essay-1/regenerate', {
      method: 'POST',
      body: JSON.stringify({ preference_notes: 'new note' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'essay-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGetUserPreferenceNotes).toHaveBeenCalledWith('user-1', 5);
    expect(mockedUpdateModelEssay).toHaveBeenCalledWith(
      'essay-1',
      expect.objectContaining({
        user_edited_content: 'new content',
        is_user_edited: true,
        user_preference_notes: 'new note',
      })
    );
    expect(data.model_essay.user_edited_content).toBe('new content');
  });

  it('returns 500 with preference-note relationship error text', async () => {
    mockedGetUserPreferenceNotes.mockRejectedValue(
      new Error("Failed to get preference notes: Could not find a relationship between 'model_essays' and 'essay_submissions' in the schema cache")
    );

    const request = new NextRequest('http://localhost:3000/api/model-essays/essay-1/regenerate', {
      method: 'POST',
      body: JSON.stringify({ preference_notes: 'new note' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'essay-1' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Failed to get preference notes");
    expect(data.error).toContain("schema cache");
  });
});

