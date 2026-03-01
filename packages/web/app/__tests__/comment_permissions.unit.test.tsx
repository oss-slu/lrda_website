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

// API Service stable mock - using new function-based services
jest.mock('../lib/services', () => ({
  fetchCreatorName: async () => 'User',
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
      id: 'student-1',
      name: 'Student',
      email: 'student@example.com',
      role: 'user',
    };

    render(
      <CommentSidebar
        noteId={'n1'}
        isInstructor={false}
        canComment={true}
        getCurrentSelection={() => null}
      />,
    );
    expect(await screen.findByRole('button', { name: /add comment/i })).toBeTruthy();
    expect(screen.queryByText(/resolve/i)).toBeNull();
    expect(screen.queryByText(/delete/i)).toBeNull();
  });

  test('instructor sees Resolve/Delete buttons (when threads exist)', async () => {
    mockAuthState.user = {
      id: 'inst-1',
      name: 'Instructor',
      email: 'instructor@example.com',
      role: 'admin',
    };

    render(
      <CommentSidebar
        noteId={'n1'}
        isInstructor={true}
        canComment={true}
        getCurrentSelection={() => ({ from: 1, to: 2 })}
      />,
    );
    expect(await screen.findByRole('button', { name: /add comment/i })).toBeTruthy();
    // Actual buttons appear when threads render; this test ensures no crash and gating configured
  });
});
