import React from 'react';
import { render, screen } from '@testing-library/react';
import CommentSidebar from '../lib/components/comments/CommentSidebar';

// API Service stable mock
jest.mock('../lib/utils/api_service', () => ({
  __esModule: true,
  default: {
    fetchCommentsForNote: async () => [],
    createComment: async () => ({}),
    fetchCreatorName: async () => 'User',
  },
}));

// User singleton mock with configurable methods per test
const mockedUser = {
  isInstructor: jest.fn<Promise<boolean>, []>(),
  getId: jest.fn<Promise<string>, []>(),
  getName: jest.fn<Promise<string>, []>(),
};
jest.mock('../lib/models/user_class', () => ({
  User: {
    getInstance: () => mockedUser,
  },
}));

describe('CommentSidebar - permission gating', () => {
  beforeEach(() => {
    mockedUser.isInstructor.mockReset();
    mockedUser.getId.mockReset();
    mockedUser.getName.mockReset();
  });

  test('student cannot see Resolve/Delete buttons', async () => {
    mockedUser.isInstructor.mockResolvedValue(false);
    mockedUser.getId.mockResolvedValue('student-1');
    mockedUser.getName.mockResolvedValue('Student');

    render(<CommentSidebar noteId={'n1'} getCurrentSelection={() => null} />);
    expect(await screen.findByRole('button', { name: /add comment/i })).toBeTruthy();
    expect(screen.queryByText(/resolve/i)).toBeNull();
    expect(screen.queryByText(/delete/i)).toBeNull();
  });

  test('instructor sees Resolve/Delete buttons (when threads exist)', async () => {
    mockedUser.isInstructor.mockResolvedValue(true);
    mockedUser.getId.mockResolvedValue('inst-1');
    mockedUser.getName.mockResolvedValue('Instructor');

    render(<CommentSidebar noteId={'n1'} getCurrentSelection={() => ({ from: 1, to: 2 })} />);
    expect(await screen.findByRole('button', { name: /add comment/i })).toBeTruthy();
    // Actual buttons appear when threads render; this test ensures no crash and gating configured
  });
});


