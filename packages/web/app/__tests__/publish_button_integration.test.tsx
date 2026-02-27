import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublishToggle from '../lib/components/NoteEditor/NoteElements/PublishToggle';

// Mock tooltip component
jest.mock('../../components/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <span>{children}</span>),
  TooltipContent: () => null,
}));

// Mock auth store with instructor user
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: {
        id: 'mockUserId',
        name: 'Mock User',
        email: 'mock@example.com',
        role: 'admin',
        isInstructor: true,
      },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

describe('PublishToggle Integration Test', () => {
  it('toggles publish state when clicked', async () => {
    let isPublished = false;
    const onPublishClickMock = jest.fn(async () => {
      isPublished = !isPublished;
    });

    const { rerender } = render(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={isPublished} onPublishClick={onPublishClickMock} />,
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));

    // Simulate parent state change
    rerender(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={true} onPublishClick={onPublishClickMock} />,
    );
    expect(screen.getByText('Unpublish')).toBeInTheDocument();
  });

  it('does not crash when onPublishClick is not provided', () => {
    render(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={false} />,
    );
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
  });
});
