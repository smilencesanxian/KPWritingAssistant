/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { PUT } from './route';
import { createClient } from '@/lib/supabase/server';
import { updateModelEssay } from '@/lib/db/model-essays';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/db/model-essays');

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockedUpdateModelEssay = updateModelEssay as jest.MockedFunction<typeof updateModelEssay>;

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

function createModelEssayQueryResult(modelEssayData: unknown, error: unknown = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: modelEssayData, error }),
  };
}

function createMockSupabase(user: typeof mockUser | null, modelEssayData: unknown, error: unknown = null) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'model_essays') {
        return createModelEssayQueryResult(modelEssayData, error);
      }

      throw new Error(`Unexpected table access: ${table}`);
    }),
  };
}

describe('PUT /api/model-essays/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockedCreateClient.mockResolvedValue(
      createMockSupabase(null, null) as unknown as ReturnType<typeof createClient>
    );

    const request = new NextRequest('http://localhost:3000/api/model-essays/essay-123', {
      method: 'PUT',
      body: JSON.stringify({ user_edited_content: 'Edited essay' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'essay-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockedUpdateModelEssay).not.toHaveBeenCalled();
  });

  it('should return 400 when user_edited_content is missing', async () => {
    const modelEssayData = {
      id: 'essay-123',
      content: 'Original AI draft',
      user_edited_content: null,
      corrections: {
        submission_id: 'submission-123',
        essay_submissions: { user_id: mockUser.id },
      },
    };

    mockedCreateClient.mockResolvedValue(
      createMockSupabase(mockUser, modelEssayData) as unknown as ReturnType<typeof createClient>
    );

    const request = new NextRequest('http://localhost:3000/api/model-essays/essay-123', {
      method: 'PUT',
      body: JSON.stringify({ user_preference_notes: 'more vivid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'essay-123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('user_edited_content is required');
    expect(mockedUpdateModelEssay).not.toHaveBeenCalled();
  });

  it('should persist the edited essay and return the stored record', async () => {
    const modelEssayData = {
      id: 'essay-123',
      content: 'Original AI draft',
      user_edited_content: 'Previous custom version',
      is_user_edited: true,
      user_preference_notes: 'older note',
      corrections: {
        submission_id: 'submission-123',
        essay_submissions: { user_id: mockUser.id },
      },
    };
    const updatedEssay = {
      id: 'essay-123',
      correction_id: 'correction-123',
      target_level: 'excellent' as const,
      content: 'Original AI draft',
      created_at: '2026-04-07T00:00:00.000Z',
      user_edited_content: 'Newest saved version',
      is_user_edited: true,
      edit_history: [],
      user_preference_notes: 'new note',
    };

    mockedCreateClient.mockResolvedValue(
      createMockSupabase(mockUser, modelEssayData) as unknown as ReturnType<typeof createClient>
    );
    mockedUpdateModelEssay.mockResolvedValue(updatedEssay);

    const request = new NextRequest('http://localhost:3000/api/model-essays/essay-123', {
      method: 'PUT',
      body: JSON.stringify({
        user_edited_content: 'Newest saved version',
        user_preference_notes: 'new note',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'essay-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.model_essay).toEqual(updatedEssay);
    expect(mockedUpdateModelEssay).toHaveBeenCalledWith(
      'essay-123',
      expect.objectContaining({
        user_edited_content: 'Newest saved version',
        is_user_edited: true,
        user_preference_notes: 'new note',
        edit_history: [
          expect.objectContaining({
            original: 'Previous custom version',
            edited: 'Newest saved version',
            note: 'new note',
          }),
        ],
      })
    );
  });

  it('should return 500 when persistence fails', async () => {
    const modelEssayData = {
      id: 'essay-123',
      content: 'Original AI draft',
      user_edited_content: null,
      corrections: {
        submission_id: 'submission-123',
        essay_submissions: { user_id: mockUser.id },
      },
    };

    mockedCreateClient.mockResolvedValue(
      createMockSupabase(mockUser, modelEssayData) as unknown as ReturnType<typeof createClient>
    );
    mockedUpdateModelEssay.mockRejectedValue(
      new Error('Failed to update model essay: update returned no rows')
    );

    const request = new NextRequest('http://localhost:3000/api/model-essays/essay-123', {
      method: 'PUT',
      body: JSON.stringify({ user_edited_content: 'Edited essay' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await PUT(request, { params: Promise.resolve({ id: 'essay-123' }) });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to update model essay');
  });
});
