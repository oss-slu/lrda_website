import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentSidebar from '../lib/components/comments/CommentSidebar';

jest.mock('../lib/models/user_class', () => ({
  User: {
    getInstance: () => ({
      isInstructor: async () => true,
      getId: async () => 'inst-1',
      getName: async () => 'Instructor',
    }),
  },
}));

jest.mock('../lib/utils/api_service', () => ({
  __esModule: true,
  default: {
    fetchCommentsForNote: async () => [
      { id: 'c1', noteId: 'n1', text: 'Root 1', authorId: 'inst-1', authorName: 'Instructor', createdAt: new Date().toISOString(), role: 'instructor', position: { from: 1, to: 2 }, threadId: 't1', parentId: null, resolved: false },
      { id: 'c2', noteId: 'n1', text: 'Root 2', authorId: 'inst-1', authorName: 'Instructor', createdAt: new Date().toISOString(), role: 'instructor', position: { from: 3, to: 4 }, threadId: 't2', parentId: null, resolved: false },
    ],
    createComment: async () => ({}),
    fetchCreatorName: async () => 'Instructor',
  },
}));

describe('CommentSidebar - per-thread reply drafts', () => {
  test('typing in one thread reply does not mirror in another', async () => {
    render(<CommentSidebar noteId={'n1'} getCurrentSelection={() => ({ from: 1, to: 2 })} />);

    const replyInputs = await screen.findAllByPlaceholderText(/reply/i);
    expect(replyInputs.length).toBeGreaterThanOrEqual(2);

    fireEvent.change(replyInputs[0], { target: { value: 'Reply A' } });
    expect((replyInputs[0] as HTMLInputElement).value).toBe('Reply A');
    expect((replyInputs[1] as HTMLInputElement).value).toBe('');
  });
});


