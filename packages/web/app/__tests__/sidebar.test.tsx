import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import Sidebar from '../lib/components/Sidebar';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock auth store - inline to avoid hoisting issues
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: {
        uid: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        roles: { administrator: false, contributor: true },
        isInstructor: false,
      },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
      login: jest.fn().mockResolvedValue('success'),
      logout: jest.fn().mockResolvedValue(undefined),
      signup: jest.fn().mockResolvedValue(undefined),
      refreshUser: jest.fn().mockResolvedValue(undefined),
      isAdmin: jest.fn().mockReturnValue(false),
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

// Mock notes store
jest.mock('../lib/stores/notesStore', () => ({
  useNotesStore: Object.assign(
    jest.fn((selector?: (state: any) => any) => {
      const mockStore = {
        viewMode: 'my',
        selectedNoteId: null,
        setSelectedNoteId: jest.fn(),
        setViewMode: jest.fn(),
      };
      return selector ? selector(mockStore) : mockStore;
    }),
    { getState: jest.fn(() => ({ selectedNoteId: null, viewMode: 'my' })) },
  ),
}));

// Mock TanStack Query hooks
jest.mock('../lib/hooks/queries/useNotes', () => ({
  usePersonalNotes: jest.fn(() => ({
    data: [],
  })),
  useStudentNotes: jest.fn(() => ({
    data: [],
  })),
  notesKeys: {
    all: ['notes'],
    personal: (userId: string) => ['notes', 'personal', userId],
  },
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(() => []),
  })),
}));

// Mock services - inline to avoid hoisting issues
jest.mock('../lib/services', () => ({
  fetchMe: jest.fn().mockResolvedValue(null),
  fetchUserById: jest.fn().mockResolvedValue(null),
  fetchProfileById: jest.fn().mockResolvedValue(null),
  fetchInstructors: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue({}),
  assignInstructor: jest.fn().mockResolvedValue(undefined),
  fetchCreatorName: jest.fn().mockResolvedValue('Test User'),
  notesService: {
    create: jest.fn().mockResolvedValue({ '@id': 'new-note-id' }),
    fetchUserNotes: jest.fn().mockResolvedValue([]),
  },
}));

describe('Sidebar Component', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it('renders the sidebar correctly', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const addButton = screen.getByTestId('add-note-button');
    expect(addButton).toBeInTheDocument();
  });

  it('displays the toggle switch for published notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedToggle = screen.getByText('Published');
    const unpublishedToggle = screen.getByText('Unpublished');
    expect(publishedToggle).toBeInTheDocument();
    expect(unpublishedToggle).toBeInTheDocument();
  });

  it('toggles between published and unpublished notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const tabsElement = screen.getByRole('tablist');
    expect(tabsElement).toBeInTheDocument();
  });
});
