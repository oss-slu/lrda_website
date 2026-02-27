/**
 * Tests for Sidebar gating on auth initialization.
 *
 * Verifies that:
 * 1. usePersonalNotes does NOT fire before auth is initialized (prevents
 *    notes disappearing on refresh when the API treats the user as anonymous).
 * 2. usePersonalNotes fires correctly once auth is initialized.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../lib/components/Sidebar';
import { usePersonalNotes, useStudentNotes } from '../lib/hooks/queries/useNotes';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Track the userId passed to usePersonalNotes
const mockUsePersonalNotes = jest.fn((_userId?: any) => ({ data: [] }));
const mockUseStudentNotes = jest.fn((_instructorId?: any) => ({ data: [] }));

jest.mock('../lib/hooks/queries/useNotes', () => ({
  usePersonalNotes: mockUsePersonalNotes,
  useStudentNotes: mockUseStudentNotes,
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

// Mock services
jest.mock('../lib/services', () => ({
  fetchMe: jest.fn().mockResolvedValue(null),
  fetchProfileById: jest.fn().mockResolvedValue(null),
  fetchInstructors: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue({}),
  assignInstructor: jest.fn().mockResolvedValue(undefined),
  fetchCreatorName: jest.fn().mockResolvedValue('Test User'),
  notesService: {
    create: jest.fn().mockResolvedValue({ id: 'new-note-id' }),
    fetchUserNotes: jest.fn().mockResolvedValue([]),
  },
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

jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

describe('Sidebar - auth initialization gate', () => {
  beforeEach(() => {
    mockUsePersonalNotes.mockClear();
    mockUseStudentNotes.mockClear();
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

    render(<Sidebar onNoteSelect={jest.fn()} />);

    // usePersonalNotes should be called with null (disabled)
    // so the API call doesn't fire before auth is ready
    expect(mockUsePersonalNotes).toHaveBeenCalled();
    const firstCallArg = mockUsePersonalNotes.mock.calls[0][0];
    expect(firstCallArg).toBeNull();
  });

  test('passes userId to usePersonalNotes when auth IS initialized', () => {
    mockAuthState.isInitialized = true;

    render(<Sidebar onNoteSelect={jest.fn()} />);

    expect(mockUsePersonalNotes).toHaveBeenCalled();
    const firstCallArg = mockUsePersonalNotes.mock.calls[0][0];
    expect(firstCallArg).toBe('student-1');
  });
});
