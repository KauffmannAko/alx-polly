import { POST } from '@/app/api/polls/[id]/vote/route';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Mock the createClient function
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
}));

describe('Poll Vote API Route', () => {
  let mockRequest: NextRequest;
  let mockParams: { id: string };
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    mockRequest = new NextRequest(new URL('http://localhost:3000/api/polls/123/vote'));
    
    // Mock params
    mockParams = { id: '123' };

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      auth: {
        getUser: jest.fn(),
      },
    };

    // Set up the mock implementation
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('POST /api/polls/[id]/vote', () => {
    it('should record a vote when authenticated', async () => {
      // Mock authenticated user
      const userId = 'user-123';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      // Mock successful vote insertion
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'vote-123', poll_id: '123', option_id: 'opt1', user_id: userId },
              error: null,
            }),
          }),
        }),
      });

      // Mock request body
      const requestBody = {
        optionId: 'opt1',
      };

      // Mock the request.json() method
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      // Call the handler
      const response = await POST(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('votes');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        poll_id: '123',
        option_id: 'opt1',
        user_id: userId,
      });
      expect(responseData.message).toContain('Vote recorded successfully');
      expect(response.status).toBe(200);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Mock request body
      mockRequest.json = jest.fn().mockResolvedValue({ optionId: 'opt1' });

      // Call the handler
      const response = await POST(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Unauthorized' });
      expect(response.status).toBe(401);
    });

    it('should return 400 when option ID is missing', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock request body with missing optionId
      mockRequest.json = jest.fn().mockResolvedValue({});

      // Call the handler
      const response = await POST(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Option ID is required' });
      expect(response.status).toBe(400);
    });

    it('should handle database errors when recording a vote', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock database error
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      // Mock request body
      mockRequest.json = jest.fn().mockResolvedValue({ optionId: 'opt1' });

      // Call the handler
      const response = await POST(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Failed to record vote' });
      expect(response.status).toBe(500);
    });
  });
});