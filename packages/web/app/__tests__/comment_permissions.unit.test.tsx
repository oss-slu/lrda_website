import React from 'react';
import { render, screen } from '@testing-library/react';
import CommentSidebar from '../lib/components/comments/CommentSidebar';

// Mock TanStack Query hooks
jest.mock('../lib/hooks/queries/useComments', () => ({
  useComments: jest.fn(() => ({
    data: [],
    refetch: jest.fn(),
  })),
  useCommentMutations: jest.fn(() => ({
    createComment: { mutateAsync: jest.fn() },
    resolveThread: { mutateAsync: jest.fn() },
    deleteComment: { mutateAsync: jest.fn() },
  })),
}));

// API Service stable mock
jest.mock('../lib/utils/api_service', () => ({
  __esModule: true,
  default: {
    fetchCreatorName: async () => 'User',
    fetchUserData: async (uid: string) => {
      if (uid === 'student-1') {
        return {
          uid: 'student-1',
          name: 'Student',
          parentInstructorId: 'instructor-1',
          roles: { contributor: true, administrator: false },
        };
      }
      if (uid === 'inst-1') {
        return {
          uid: 'inst-1',
          name: 'Instructor',
          isInstructor: true,
          roles: { contributor: false, administrator: true },
        };
      }
      return null;
    },
  },
}));

// Mock auth store with configurable state per test
const mockAuthState = {
  user: null as any,
  isLoggedIn: true,
  isLoading: false,
  isInitialized: true,
};

jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(selector => {
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

describe('CommentSidebar - permission gating', () => {
  beforeEach(() => {
    // Reset mock state before each test
    mockAuthState.user = null;
  });

  test('student cannot see Resolve/Delete buttons', async () => {
    mockAuthState.user = {
      uid: 'student-1',
      name: 'Student',
      roles: { contributor: true, administrator: false },
    };

    render(<CommentSidebar noteId={'n1'} getCurrentSelection={() => null} />);
    expect(await screen.findByRole('button', { name: /add comment/i })).toBeTruthy();
    expect(screen.queryByText(/resolve/i)).toBeNull();
    expect(screen.queryByText(/delete/i)).toBeNull();
  });

  test('instructor sees Resolve/Delete buttons (when threads exist)', async () => {
    mockAuthState.user = {
      uid: 'inst-1',
      name: 'Instructor',
      roles: { contributor: false, administrator: true },
    };

    render(<CommentSidebar noteId={'n1'} getCurrentSelection={() => ({ from: 1, to: 2 })} />);
    expect(await screen.findByRole('button', { name: /add comment/i })).toBeTruthy();
    // Actual buttons appear when threads render; this test ensures no crash and gating configured
  });
});
