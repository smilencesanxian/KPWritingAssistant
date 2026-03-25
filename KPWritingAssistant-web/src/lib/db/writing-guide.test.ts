import { getWritingGuideTree, syncWritingGuideFromCorrection } from '@/lib/db/writing-guide';
import { createClient } from '@/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Writing Guide Database Functions', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    single: jest.fn(),
    not: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('getWritingGuideTree', () => {
    it('should return tree structure from flat nodes', async () => {
      const userId = 'user-123';
      const mockNodes = [
        { id: '1', user_id: null, parent_id: null, node_type: 'essay_type', label: '邮件 (Part 1)', highlight_id: null, source: 'system', sort_order: 1, created_at: '2024-01-01', highlight: null },
        { id: '2', user_id: 'user-123', parent_id: '1', node_type: 'topic', label: 'My Topic', highlight_id: null, source: 'user', sort_order: 1, created_at: '2024-01-01', highlight: null },
        { id: '3', user_id: 'user-123', parent_id: '2', node_type: 'highlight', label: 'Highlight 1', highlight_id: 'h1', source: 'user', sort_order: 1, created_at: '2024-01-01', highlight: { text: 'Sample text', type: 'phrase' } },
      ];

      mockSupabase.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockNodes, error: null }),
      });

      const result = await getWritingGuideTree(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('2');
      expect(result[0].children[0].children).toHaveLength(1);
      expect(result[0].children[0].children[0].id).toBe('3');
      expect(result[0].children[0].children[0].highlight).toEqual({ text: 'Sample text', type: 'phrase' });
    });

    it('should throw error when database query fails', async () => {
      const userId = 'user-123';

      mockSupabase.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      });

      await expect(getWritingGuideTree(userId)).rejects.toThrow('Failed to get writing guide tree: DB Error');
    });

    it('should return empty array when no nodes found', async () => {
      const userId = 'user-123';

      mockSupabase.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await getWritingGuideTree(userId);

      expect(result).toEqual([]);
    });

    it('should handle nodes with null highlight correctly', async () => {
      const userId = 'user-123';
      const mockNodes = [
        { id: '1', user_id: null, parent_id: null, node_type: 'essay_type', label: '邮件 (Part 1)', highlight_id: null, source: 'system', sort_order: 1, created_at: '2024-01-01', highlight: null },
      ];

      mockSupabase.order.mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: mockNodes, error: null }),
      });

      const result = await getWritingGuideTree(userId);

      expect(result).toHaveLength(1);
      expect(result[0].highlight).toBeUndefined();
    });
  });

  describe('syncWritingGuideFromCorrection', () => {
    it('should return early when no essay topic provided', async () => {
      const userId = 'user-123';
      const highlightIds = ['h1', 'h2'];

      await syncWritingGuideFromCorrection(userId, null, highlightIds);

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return early when no highlight IDs provided', async () => {
      const userId = 'user-123';
      const essayTopic = 'Test Topic';

      await syncWritingGuideFromCorrection(userId, essayTopic, []);

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should return early when essay topic is empty string', async () => {
      const userId = 'user-123';
      const essayTopic = '';
      const highlightIds = ['h1'];

      await syncWritingGuideFromCorrection(userId, essayTopic, highlightIds);

      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });
});
