import React from 'react';
import { render, screen } from '@testing-library/react';
import PublishToggle from '../lib/components/NoteEditor/NoteElements/PublishToggle';

// Mock tooltip component
jest.mock('../../components/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <span>{children}</span>),
  TooltipContent: ({ children }: any) => <span>{children}</span>,
}));

// Mock auth store with instructor user (needed for isInstructorReview to take effect)
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: {
        id: 'i1',
        name: 'Instructor',
        email: 'instructor@example.com',
        role: 'user',
        isInstructor: true,
      },
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
    expect(screen.getByText('Approve')).toBeTruthy();
  });
});
