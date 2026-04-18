/**
 * @jest-environment node
 */

import { getUserPreferenceNotes, updateModelEssay } from '@/lib/db/model-essays';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

describe('model-essays DB layer', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('getUserPreferenceNotes', () => {
    it('UT-001: should return preference notes for a user with notes', async () => {
      const userId = 'user-abc';
      const mockData = [
        { user_preference_notes: 'Note A', corrections: { essay_submissions: { user_id: userId } } },
        { user_preference_notes: 'Note B', corrections: { essay_submissions: { user_id: userId } } },
      ];

      // The query chain ends at .limit() which returns a Promise
      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await getUserPreferenceNotes(userId, 5);

      expect(result).toEqual(['Note A', 'Note B']);
      expect(mockSupabase.from).toHaveBeenCalledWith('model_essays');
      expect(mockSupabase.eq).toHaveBeenCalledWith('corrections.essay_submissions.user_id', userId);
      expect(mockSupabase.not).toHaveBeenCalledWith('user_preference_notes', 'is', null);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it('UT-002: should return empty array when user has no preference notes', async () => {
      const userId = 'user-no-notes';

      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      const result = await getUserPreferenceNotes(userId);

      expect(result).toEqual([]);
    });

    it('UT-003: should filter out null user_preference_notes from results', async () => {
      const userId = 'user-mixed';
      // Even though .not('user_preference_notes', 'is', null) is used in the query,
      // the function also has a client-side filter as a safety net.
      const mockData = [
        { user_preference_notes: 'Valid note' },
        { user_preference_notes: null },
        { user_preference_notes: 'Another valid note' },
      ];

      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await getUserPreferenceNotes(userId);

      expect(result).toEqual(['Valid note', 'Another valid note']);
      expect(result).not.toContain(null);
    });

    it('UT-004: should respect the limit parameter', async () => {
      const userId = 'user-limit';
      const customLimit = 3;
      const mockData = [
        { user_preference_notes: 'Note 1' },
        { user_preference_notes: 'Note 2' },
        { user_preference_notes: 'Note 3' },
      ];

      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await getUserPreferenceNotes(userId, customLimit);

      expect(result).toHaveLength(3);
      expect(mockSupabase.limit).toHaveBeenCalledWith(customLimit);
    });

    it('UT-005: should use default limit of 5 when not specified', async () => {
      const userId = 'user-default-limit';
      const mockData = [
        { user_preference_notes: 'Note 1' },
        { user_preference_notes: 'Note 2' },
      ];

      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

      await getUserPreferenceNotes(userId);

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it('UT-006: should order results by created_at descending', async () => {
      const userId = 'user-order';
      const mockData = [
        { user_preference_notes: 'Newest note', created_at: '2024-06-01T00:00:00Z' },
        { user_preference_notes: 'Older note', created_at: '2024-01-01T00:00:00Z' },
      ];

      mockSupabase.limit.mockResolvedValue({ data: mockData, error: null });

      const result = await getUserPreferenceNotes(userId);

      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      // Verify the order is preserved from the query result
      expect(result[0]).toBe('Newest note');
      expect(result[1]).toBe('Older note');
    });

    it('UT-007: should throw error when Supabase query fails', async () => {
      const userId = 'user-error';

      mockSupabase.limit.mockResolvedValue({
        data: null,
        error: { message: 'Could not find a relationship between tables' },
      });

      await expect(getUserPreferenceNotes(userId)).rejects.toThrow(
        'Failed to get preference notes: Could not find a relationship between tables'
      );
    });

    it('UT-008: should handle undefined data gracefully (return empty array)', async () => {
      const userId = 'user-undefined';

      mockSupabase.limit.mockResolvedValue({ data: undefined, error: null });

      const result = await getUserPreferenceNotes(userId);

      expect(result).toEqual([]);
    });

    it('UT-009: should pass the correct select string with join syntax', async () => {
      const userId = 'user-select';
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      await getUserPreferenceNotes(userId);

      // Verify the select call includes the join syntax
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('user_preference_notes')
      );
      // The select should contain the corrections join
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('corrections')
      );
    });
  });

  describe('updateModelEssay', () => {
    it('UT-010: should update user_preference_notes', async () => {
      const mockUpdated = {
        id: 'essay-1',
        user_preference_notes: 'Updated notes',
        is_user_edited: false,
      };

      mockSupabase.single.mockResolvedValue({ data: mockUpdated, error: null });

      const result = await updateModelEssay('essay-1', {
        user_preference_notes: 'Updated notes',
      });

      expect(result.user_preference_notes).toBe('Updated notes');
      expect(mockSupabase.from).toHaveBeenCalledWith('model_essays');
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({ user_preference_notes: 'Updated notes' })
      );
    });

    it('UT-011: should throw error when update fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Row not found' },
      });

      await expect(
        updateModelEssay('non-existent', { user_preference_notes: 'test' })
      ).rejects.toThrow('Failed to update model essay: Row not found');
    });

    it('UT-012: should throw error when update returns no rows', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      await expect(
        updateModelEssay('non-existent', { user_preference_notes: 'test' })
      ).rejects.toThrow('Failed to update model essay: update returned no rows');
    });
  });
});
