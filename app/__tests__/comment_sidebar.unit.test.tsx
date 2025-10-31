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

jest.mock('../lib/utils/api_service', () => ({
  __esModule: true,
  default: {
    fetchCommentsForNote: async () => [],
    createComment: async () => ({}),
    fetchCreatorName: async () => 'Student User',
  },
}));

describe('CommentSidebar - students can comment', () => {
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


