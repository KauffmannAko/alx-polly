import { GET, POST } from '@/app/api/polls/route';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Mock the createClient function
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
}));

describe('Polls API Routes', () => {
  let mockRequest: NextRequest;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    mockRequest = new NextRequest(new URL('http://localhost:3000/api/polls'));

    // Mock Supabase client
      mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        auth: {
          getUser: jest.fn(),
        },
      };

    // Set up the mock implementation
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET /api/polls', () => {
    it('should return all polls', async () => {
      // Mock data
      const mockPolls = [
        { id: '1', title: 'Poll 1' },
        { id: '2', title: 'Poll 2' },
      ];

      // Set up the mock implementation
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            data: mockPolls,
            error: null,
          }),
        }),
      });

      // Call the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(responseData).toEqual({ polls: mockPolls });
      expect(response.status).toBe(200);
    });

    it('should handle errors', async () => {
      // Mock error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      // Call the handler
      const response = await GET(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Database error' });
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/polls', () => {
    it('should create a new poll when authenticated', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock successful poll creation
      const mockPoll = { id: 'new-poll-id', title: 'New Poll' };
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: mockPoll,
            error: null,
          }),
        }),
      });

      // Mock request body
      const requestBody = {
        title: 'New Poll',
        description: 'Poll description',
        options: ['Option 1', 'Option 2'],
        duration: 7,
      };

      // Mock the request.json() method
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      // Call the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(responseData.message).toContain('Poll created successfully');
      expect(response.status).toBe(201);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Call the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Unauthorized' });
      expect(response.status).toBe(401);
    });

    it('should handle invalid request body', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock invalid request body
      mockRequest.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

      // Call the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Invalid JSON in request body' });
      expect(response.status).toBe(400);
    });

    it('should validate required fields', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock request with missing fields
      const requestBody = {
        title: 'New Poll',
        // Missing options
      };

      // Mock the request.json() method
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      // Call the handler
      const response = await POST(mockRequest);
      const responseData = await response.json();

      // Assertions
      expect(responseData.error).toContain('Invalid poll data');
      expect(response.status).toBe(400);
    });
  });
});