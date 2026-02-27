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

describe('PublishToggle Component', () => {
  it('renders the publish button with correct initial state', () => {
    render(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={false} onPublishClick={jest.fn()} />,
    );
    const publishButton = screen.getByText('Publish');
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass('text-gray-700');
  });

  it('renders as published when isPublished is true', () => {
    render(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={true} onPublishClick={jest.fn()} />,
    );
    const publishButton = screen.getByText('Unpublish');
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass('text-green-600');
  });

  it('calls onPublishClick when clicked', async () => {
    const onPublishClickMock = jest.fn();
    render(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={false} onPublishClick={onPublishClickMock} />,
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));
  });

  it('updates correctly when isPublished prop changes', () => {
    const { rerender } = render(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={false} onPublishClick={jest.fn()} />,
    );
    const button = screen.getByText('Publish');
    expect(button).toHaveClass('text-gray-700');

    rerender(
      <PublishToggle noteId='test-note' userId='mockUserId' isPublished={true} onPublishClick={jest.fn()} />,
    );
    const updatedButton = screen.getByText('Unpublish');
    expect(updatedButton).toHaveClass('text-green-600');
  });
});
