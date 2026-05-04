import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublishToggle from '../lib/components/NoteEditor/NoteElements/PublishToggle';

// Mock tooltip component (now at ui/tooltip)
vi.mock('../../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children, asChild }: any) => (asChild ? children : <span>{children}</span>),
  TooltipContent: () => null,
}));

// Mutable mock user -- tests can swap between instructor/admin and student
let mockUser: Record<string, any> = {
  id: 'mockUserId',
  name: 'Mock User',
  email: 'mock@example.com',
  role: 'admin',
  isInstructor: true,
};

vi.mock('../lib/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: mockUser,
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

describe('PublishToggle Component - instructor/admin user', () => {
  beforeEach(() => {
    mockUser = {
      id: 'mockUserId',
      name: 'Mock User',
      email: 'mock@example.com',
      role: 'admin',
      isInstructor: true,
    };
  });

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

describe('PublishToggle Component - student user', () => {
  beforeEach(() => {
    mockUser = {
      id: 'studentUserId',
      name: 'Student User',
      email: 'student@example.com',
      role: 'user',
      isInstructor: false,
    };
  });

  it('shows "Request Approval" for unpublished note', () => {
    render(
      <PublishToggle
        noteId='test-note'
        userId='studentUserId'
        isPublished={false}
        onRequestApprovalClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Request Approval')).toBeInTheDocument();
  });

  it('calls onRequestApprovalClick (not onPublishClick) when clicked on unpublished', async () => {
    const onRequestApprovalMock = vi.fn();
    const onPublishClickMock = vi.fn();
    render(
      <PublishToggle
        noteId='test-note'
        userId='studentUserId'
        isPublished={false}
        onPublishClick={onPublishClickMock}
        onRequestApprovalClick={onRequestApprovalMock}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(onRequestApprovalMock).toHaveBeenCalledTimes(1));
    expect(onPublishClickMock).not.toHaveBeenCalled();
  });

  it('shows "Unpublish" for published note as student', () => {
    render(
      <PublishToggle
        noteId='test-note'
        userId='studentUserId'
        isPublished={true}
        onPublishClick={vi.fn()}
      />,
    );
    expect(screen.getByText('Unpublish')).toBeInTheDocument();
  });
});
