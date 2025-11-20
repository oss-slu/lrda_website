import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentSidebar from '../lib/components/comments/CommentSidebar';

jest.mock('../lib/models/user_class', () => ({
  User: {
    getInstance: () => ({
      isInstructor: async () => false,
      getId: async () => 'student-1',
      getName: async () => 'Student User',
      getRoles: async () => ({ contributor: true, administrator: false }),
    }),
  },
}));

// Track comments for the mock
const mockComments: any[] = [];

jest.mock('../lib/utils/api_service', () => ({
  __esModule: true,
  default: {
    fetchCommentsForNote: async () => [...mockComments],
    createComment: async (comment: any) => {
      // Add the comment to the mock array
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
    fetchCreatorName: async () => 'Student User',
    fetchUserData: async (uid: string) => {
      // Mock student with parentInstructorId (part of teacher-student relationship)
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
  },
}));

describe('CommentSidebar - students can comment', () => {
  beforeEach(() => {
    // Clear mock comments before each test
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


