/**
 * API Route Tests - User Profile
 * Tests for /api/user-profile endpoints
 */

import { GET, PUT } from '@/app/api/user-profile/route';
import { NextRequest } from 'next/server';

// Mock Supabase server client
jest.mock('@/lib/supabaseServer', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  }),
}));

describe('/api/user-profile', () => {
  describe('GET', () => {
    it('should return 401 if not authenticated', async () => {
      // Mock unauthenticated user
      const { createClient } = require('@/lib/supabaseServer');
      const mockClient = createClient();
      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/user-profile');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should return user profile when authenticated', async () => {
      const { createClient } = require('@/lib/supabaseServer');
      const mockClient = createClient();

      // Mock authenticated user
      mockClient.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'test-auth-id',
            email: 'test@gatech.edu',
          },
        },
        error: null,
      });

      // Mock database response
      const mockProfile = {
        id: 1,
        auth_id: 'test-auth-id',
        email: 'test@gatech.edu',
        full_name: 'Test Student',
        major: 'Computer Science',
      };

      mockClient.from().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user-profile');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.fullName).toBe('Test Student'); // Transformed to camelCase
      expect(data.major).toBe('Computer Science');
    });

    it('should return 404 if profile not found', async () => {
      const { createClient } = require('@/lib/supabaseServer');
      const mockClient = createClient();

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-auth-id' } },
        error: null,
      });

      mockClient.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const request = new NextRequest('http://localhost:3000/api/user-profile');
      const response = await GET(request);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT', () => {
    it('should return 401 if not authenticated', async () => {
      const { createClient } = require('@/lib/supabaseServer');
      const mockClient = createClient();

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost:3000/api/user-profile', {
        method: 'PUT',
        body: JSON.stringify({ major: 'Computer Science' }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(401);
    });

    it('should update user profile when authenticated', async () => {
      const { createClient } = require('@/lib/supabaseServer');
      const mockClient = createClient();

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-auth-id' } },
        error: null,
      });

      const updatedProfile = {
        id: 1,
        auth_id: 'test-auth-id',
        email: 'test@gatech.edu',
        major: 'Computer Science',
        graduation_year: 2026,
      };

      mockClient.from().eq().single.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user-profile', {
        method: 'PUT',
        body: JSON.stringify({
          major: 'Computer Science',
          graduationYear: 2026,
        }),
      });

      const response = await PUT(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.major).toBe('Computer Science');
      expect(data.graduationYear).toBe(2026); // Transformed from snake_case
    });

    it('should validate input data', async () => {
      const { createClient } = require('@/lib/supabaseServer');
      const mockClient = createClient();

      mockClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-auth-id' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/user-profile', {
        method: 'PUT',
        body: JSON.stringify({
          invalid_field: 'should_not_be_accepted',
        }),
      });

      const response = await PUT(request);

      // Should either reject invalid fields or ignore them
      expect([200, 400]).toContain(response.status);
    });
  });
});
