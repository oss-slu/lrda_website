import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('PublishToggle Component', () => {
  it('renders the publish button with correct initial state', () => {
    render(<PublishToggle isPublished={false} onPublishClick={jest.fn()} />);
    const publishButton = screen.getByText(/Publish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass('text-gray-700');
  });

  it('renders as published when isPublished is true', () => {
    render(<PublishToggle isPublished={true} onPublishClick={jest.fn()} />);
    const publishButton = screen.getByText(/Unpublish/i);
    expect(publishButton).toBeInTheDocument();
    expect(publishButton).toHaveClass('text-green-600');
  });

  it('calls onPublishClick when clicked', async () => {
    const onPublishClickMock = jest.fn().mockResolvedValue(undefined);
    render(<PublishToggle isPublished={false} onPublishClick={onPublishClickMock} />);
    const button = screen.getByText(/Publish/i);
    fireEvent.click(button);
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));
  });

  it('updates correctly when isPublished prop changes', () => {
    const { rerender } = render(<PublishToggle isPublished={false} onPublishClick={jest.fn()} />);
    const button = screen.getByText(/Publish/i);
    expect(button).toHaveClass('text-gray-700');

    rerender(<PublishToggle isPublished={true} onPublishClick={jest.fn()} />);
    const updatedButton = screen.getByText(/Unpublish/i);
    expect(updatedButton).toHaveClass('text-green-600');
  });
});
