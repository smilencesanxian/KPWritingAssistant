/**
 * @jest-environment node
 */
import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { getWritingGuideTree } from '@/lib/db/writing-guide';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/db/writing-guide', () => ({
  getWritingGuideTree: jest.fn(),
}));

describe('GET /api/writing-guide', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/writing-guide');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('should return writing guide tree for authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockTree = [
      {
        id: '1',
        user_id: null,
        parent_id: null,
        node_type: 'essay_type' as const,
        label: '邮件 (Part 1)',
        highlight_id: null,
        source: 'system' as const,
        sort_order: 1,
        created_at: '2024-01-01',
        children: [],
      },
    ];

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    (getWritingGuideTree as jest.Mock).mockResolvedValue(mockTree);

    const request = new Request('http://localhost:3000/api/writing-guide');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tree).toEqual(mockTree);
    expect(getWritingGuideTree).toHaveBeenCalledWith('user-123');
  });

  it('should return 500 when database query fails', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    (getWritingGuideTree as jest.Mock).mockRejectedValue(new Error('Database error'));

    const request = new Request('http://localhost:3000/api/writing-guide');
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('获取写作导览失败，请重试');
  });

  it('should return empty tree when user has no nodes', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
    (getWritingGuideTree as jest.Mock).mockResolvedValue([]);

    const request = new Request('http://localhost:3000/api/writing-guide');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.tree).toEqual([]);
  });
});
