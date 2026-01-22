import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentSidebar from '../lib/components/comments/CommentSidebar';

// Track comments for the mock
const mockComments: any[] = [];

// Mock TanStack Query hooks
jest.mock('../lib/hooks/queries/useComments', () => ({
  useComments: jest.fn(() => ({
    data: mockComments,
    refetch: jest.fn(),
  })),
  useCommentMutations: jest.fn(() => ({
    createComment: {
      mutateAsync: async (comment: any) => {
        mockComments.push({
          id: comment.id,
          noteId: comment.noteId,
          text: comment.text,
          authorId: comment.authorId,
          authorName: comment.author,
          createdAt: comment.createdAt,
          position: comment.position,
          threadId: comment.threadId,
          parentId: comment.parentId,
          resolved: comment.resolved,
          archived: false,
        });
        return {};
      },
    },
    resolveThread: { mutateAsync: jest.fn() },
    deleteComment: { mutateAsync: jest.fn() },
  })),
}));

// Mock useAuthStore
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn(selector => {
    const mockState = {
      user: {
        uid: 'student-1',
        name: 'Student User',
        roles: { contributor: true, administrator: false },
      },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockState) : mockState;
  }),
}));

jest.mock('../lib/services', () => ({
  fetchCreatorName: async () => 'Student User',
  fetchUserById: async (uid: string) => {
    if (uid === 'student-1') {
      return {
        uid: 'student-1',
        name: 'Student User',
        parentInstructorId: 'instructor-1',
        roles: { contributor: true, administrator: false },
      };
    }
    return null;
  },
}));

describe('CommentSidebar - students can comment', () => {
  beforeEach(() => {
    mockComments.length = 0;
  });

  test('allows generic comment without selection', async () => {
    render(<CommentSidebar noteId={'note-1'} getCurrentSelection={() => null} />);

    // Open add comment popover
    const addBtn = await screen.findByRole('button', { name: /add comment/i });
    fireEvent.click(addBtn);

    // Enter text and submit
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'A generic comment' } });

    const submit = await screen.findByRole('button', { name: /submit/i });
    fireEvent.click(submit);

    // Comment should now appear
    expect(await screen.findByText(/A generic comment/i)).toBeTruthy();
  });
});
