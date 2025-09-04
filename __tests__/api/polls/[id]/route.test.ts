import { GET, PUT, DELETE } from '@/app/api/polls/[id]/route';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Mock the createClient function
jest.mock('@/lib/supabase-server', () => ({
  createClient: jest.fn(),
}));

describe('Poll ID API Routes', () => {
  let mockRequest: NextRequest;
  let mockParams: { id: string };
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    mockRequest = new NextRequest(new URL('http://localhost:3000/api/polls/123'));
    
    // Mock params
    mockParams = { id: '123' };

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      auth: {
        getUser: jest.fn(),
      },
    };

    // Set up the mock implementation
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET /api/polls/[id]', () => {
    it('should return a specific poll with options', async () => {
      // Mock data
      const mockPoll = {
        id: '123',
        title: 'Test Poll',
        options: [
          { id: 'opt1', text: 'Option 1' },
          { id: 'opt2', text: 'Option 2' },
        ],
      };

      // Set up the mock implementation
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPoll,
              error: null,
            }),
          }),
        }),
      });

      // Call the handler
      const response = await GET(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('polls');
      expect(responseData).toEqual({ poll: mockPoll });
      expect(response.status).toBe(200);
    });

    it('should return 404 when poll not found', async () => {
      // Mock not found response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      // Call the handler
      const response = await GET(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Not found' });
      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/polls/[id]', () => {
    it('should update a poll when authenticated and authorized', async () => {
      // Mock authenticated user
      const userId = 'user-123';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      // Mock existing poll check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: userId },
              error: null,
            }),
          }),
        }),
      });

      // Mock successful poll update
      const mockUpdatedPoll = { id: '123', title: 'Updated Poll' };
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedPoll,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock request body
      const requestBody = {
        title: 'Updated Poll',
        description: 'Updated description',
      };

      // Mock the request.json() method
      mockRequest.json = jest.fn().mockResolvedValue(requestBody);

      // Call the handler
      const response = await PUT(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(responseData.message).toContain('Poll updated successfully');
      expect(response.status).toBe(200);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Call the handler
      const response = await PUT(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Unauthorized' });
      expect(response.status).toBe(401);
    });

    it('should return 403 when not authorized to update the poll', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock existing poll check with different user_id
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'different-user' },
              error: null,
            }),
          }),
        }),
      });

      // Mock request body
      mockRequest.json = jest.fn().mockResolvedValue({
        title: 'Updated Poll',
        description: 'Updated description',
      });

      // Call the handler
      const response = await PUT(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Unauthorized to update this poll' });
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/polls/[id]', () => {
    it('should delete a poll when authenticated and authorized', async () => {
      // Mock authenticated user
      const userId = 'user-123';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      // Mock existing poll check
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: userId },
              error: null,
            }),
          }),
        }),
      });

      // Mock successful poll deletion
      mockSupabase.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      // Call the handler
      const response = await DELETE(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(createClient).toHaveBeenCalled();
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(responseData.message).toContain('Poll deleted successfully');
      expect(response.status).toBe(200);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      // Call the handler
      const response = await DELETE(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Unauthorized' });
      expect(response.status).toBe(401);
    });

    it('should return 403 when not authorized to delete the poll', async () => {
      // Mock authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock existing poll check with different user_id
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { user_id: 'different-user' },
              error: null,
            }),
          }),
        }),
      });

      // Call the handler
      const response = await DELETE(mockRequest, { params: Promise.resolve(mockParams) });
      const responseData = await response.json();

      // Assertions
      expect(responseData).toEqual({ error: 'Unauthorized to delete this poll' });
      expect(response.status).toBe(403);
    });
  });
});