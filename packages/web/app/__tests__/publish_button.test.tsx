import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublishToggle from '../lib/components/NoteEditor/NoteElements/PublishToggle';

// Mock tooltip component (now at ui/tooltip)
vi.mock('../../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <span>{children}</span>),
  TooltipContent: () => null,
}));

// Mock auth store with instructor user
vi.mock('../lib/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: any) => any) => {
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
  it('shows "Publish" when unpublished', () => {
    render(
      <PublishToggle
        noteId='test-note'
        userId='mockUserId'
        isPublished={false}
        onPublishClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('shows "Unpublish" when published', () => {
    render(
      <PublishToggle
        noteId='test-note'
        userId='mockUserId'
        isPublished={true}
        onPublishClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Unpublish')).toBeInTheDocument();
  });

  it('calls onPublishClick when clicked', async () => {
    const onPublishClickMock = vi.fn();
    render(
      <PublishToggle
        noteId='test-note'
        userId='mockUserId'
        isPublished={false}
        onPublishClick={onPublishClickMock}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onPublishClickMock).toHaveBeenCalledTimes(1));
  });

  it('updates text when isPublished prop changes', () => {
    const { rerender } = render(
      <PublishToggle
        noteId='test-note'
        userId='mockUserId'
        isPublished={false}
        onPublishClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Publish')).toBeInTheDocument();

    rerender(
      <PublishToggle
        noteId='test-note'
        userId='mockUserId'
        isPublished={true}
        onPublishClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Unpublish')).toBeInTheDocument();
  });
});
