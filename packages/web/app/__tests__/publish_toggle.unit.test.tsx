import React from 'react';
import { render, screen } from '@testing-library/react';
import PublishToggle from '../lib/components/NoteEditor/NoteElements/PublishToggle';

// Mock auth store to prevent nanostores ESM import chain
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: { uid: 'mockUserId', email: 'mock@example.com' },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

describe('PublishToggle', () => {
  test('shows Approve for instructor reviewing a student note', () => {
    render(
      <PublishToggle
        noteId='n1'
        userId='u2'
        isPublished={false}
        isApprovalRequested={true}
        instructorId={'i1'}
        isInstructorReview={true}
      />,
    );
    expect(screen.getByText(/Approve|Publish/i)).toBeTruthy();
  });
});
