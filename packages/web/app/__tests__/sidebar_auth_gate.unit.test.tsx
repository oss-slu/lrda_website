/**
 * Tests for Sidebar gating on auth initialization.
 *
 * Verifies that:
 * 1. usePersonalNotes does NOT fire before auth is initialized (prevents
 *    notes disappearing on refresh when the API treats the user as anonymous).
 * 2. usePersonalNotes fires correctly once auth is initialized.
 */
import { describe, test, expect, vi, beforeEach, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import { usePersonalNotes } from '../hooks/queries/useNotes';
import Sidebar from '../components/Sidebar';

vi.mock('../hooks/queries/useNotes', () => ({
  usePersonalNotes: vi.fn((_userId?: any) => ({ data: [] })),
  notesKeys: {
    all: ['notes'],
    personal: (userId: string) => ['notes', 'personal', userId],
  },
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(() => []),
  })),
}));

// Mock services
vi.mock('../services', () => ({
  fetchMe: vi.fn().mockResolvedValue(null),
  fetchInstructors: vi.fn().mockResolvedValue([]),
  fetchCreatorName: vi.fn().mockResolvedValue('Test User'),
  notesService: {
    create: vi.fn().mockResolvedValue({ id: 'new-note-id' }),
    fetchUserNotes: vi.fn().mockResolvedValue([]),
  },
}));

// Mock notes store
vi.mock('../stores/notesStore', () => ({
  useNotesStore: Object.assign(
    vi.fn((selector?: (state: any) => any) => {
      const mockStore = {
        selectedNoteId: null,
        setSelectedNoteId: vi.fn(),
      };
      return selector ? selector(mockStore) : mockStore;
    }),
    { getState: vi.fn(() => ({ selectedNoteId: null })) },
  ),
}));

// Configurable auth state for tests
const mockAuthState: Record<string, any> = {
  user: {
    id: 'student-1',
    name: 'Student User',
    email: 'student@example.com',
    role: 'user',
    isInstructor: false,
    instructorId: 'instructor-1',
  },
  isLoggedIn: true,
  isLoading: false,
  isInitialized: true,
};

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: any) => any) => {
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

const mockUsePersonalNotes = usePersonalNotes as Mock;

describe('Sidebar - auth initialization gate', () => {
  beforeEach(() => {
    mockUsePersonalNotes.mockClear();
    mockAuthState.isInitialized = true;
    mockAuthState.user = {
      id: 'student-1',
      name: 'Student User',
      email: 'student@example.com',
      role: 'user',
      isInstructor: false,
      instructorId: 'instructor-1',
    };
    mockAuthState.isLoggedIn = true;
  });

  test('does NOT pass userId to usePersonalNotes when auth is not initialized', () => {
    // Simulate page refresh: user data persisted in localStorage but
    // isInitialized is false (session not yet re-validated).
    mockAuthState.isInitialized = false;

    render(<Sidebar onNoteSelect={vi.fn()} />);

    // usePersonalNotes should be called with null (disabled)
    // so the API call doesn't fire before auth is ready
    expect(mockUsePersonalNotes).toHaveBeenCalled();
    const firstCallArg = mockUsePersonalNotes.mock.calls[0][0];
    expect(firstCallArg).toBeNull();
  });

  test('passes userId to usePersonalNotes when auth IS initialized', () => {
    mockAuthState.isInitialized = true;

    render(<Sidebar onNoteSelect={vi.fn()} />);

    expect(mockUsePersonalNotes).toHaveBeenCalled();
    const firstCallArg = mockUsePersonalNotes.mock.calls[0][0];
    expect(firstCallArg).toBe('student-1');
  });
});
