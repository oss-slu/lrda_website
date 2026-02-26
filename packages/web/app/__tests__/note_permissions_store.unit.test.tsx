/**
 * Tests for useNotePermissions using auth store data directly.
 *
 * These tests verify that:
 * 1. Student permissions (canComment, isStudentViewingOwnNote) work using
 *    only auth store data -- no fetchUserById API call needed.
 * 2. Permissions work even when fetchUserById would fail (e.g., on refresh
 *    before session is re-validated).
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useNotePermissions } from '../lib/components/NoteEditor/hooks/useNotePermissions';
import type { Note } from '@/app/types';

// Mock services -- fetchUserById returns null (simulating API failure on refresh)
jest.mock('../lib/services', () => ({
  fetchUserById: jest.fn().mockResolvedValue(null),
  fetchCreatorName: jest.fn().mockResolvedValue('Unknown'),
}));

const mockAuthState: Record<string, any> = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isInitialized: true,
};

jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'Test Note',
  text: 'Test text',
  time: new Date(),
  media: [],
  audio: [],
  creator: 'student-1',
  latitude: '',
  longitude: '',
  published: false,
  tags: [],
  uid: 'student-1',
  ...overrides,
});

describe('useNotePermissions - store-based permissions', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.isLoggedIn = false;
  });

  test('student with parentInstructorId can comment on own note (no API call needed)', async () => {
    // Student has parentInstructorId in their auth store data
    mockAuthState.user = {
      uid: 'student-1',
      name: 'Student User',
      roles: { contributor: true, administrator: false },
      isInstructor: false,
      parentInstructorId: 'instructor-1',
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-1' });

    const { result } = renderHook(() => useNotePermissions(note));

    await waitFor(() => {
      expect(result.current.userId).toBe('student-1');
    });

    // These should be true even when fetchUserById returns null
    expect(result.current.isStudent).toBe(true);
    expect(result.current.canComment).toBe(true);
    expect(result.current.isStudentViewingOwnNote).toBe(true);
    expect(result.current.isInstructorUser).toBe(false);
  });

  test('instructor can comment on student note', async () => {
    mockAuthState.user = {
      uid: 'instructor-1',
      name: 'Instructor User',
      roles: { contributor: true, administrator: false },
      isInstructor: true,
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-1' });

    const { result } = renderHook(() => useNotePermissions(note));

    await waitFor(() => {
      expect(result.current.userId).toBe('instructor-1');
    });

    expect(result.current.isInstructorUser).toBe(true);
    expect(result.current.canComment).toBe(true);
    expect(result.current.isViewingStudentNote).toBe(true);
    expect(result.current.isStudentViewingOwnNote).toBe(false);
  });

  test('admin can comment', async () => {
    mockAuthState.user = {
      uid: 'admin-1',
      name: 'Admin User',
      roles: { contributor: true, administrator: true },
      isInstructor: false,
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-1' });

    const { result } = renderHook(() => useNotePermissions(note));

    await waitFor(() => {
      expect(result.current.userId).toBe('admin-1');
    });

    expect(result.current.isInstructorUser).toBe(true);
    expect(result.current.canComment).toBe(true);
  });

  test('student without parentInstructorId cannot comment', async () => {
    mockAuthState.user = {
      uid: 'student-2',
      name: 'Standalone Student',
      roles: { contributor: true, administrator: false },
      isInstructor: false,
      // No parentInstructorId
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-2' });

    const { result } = renderHook(() => useNotePermissions(note));

    await waitFor(() => {
      expect(result.current.userId).toBe('student-2');
    });

    expect(result.current.isStudent).toBe(false);
    expect(result.current.canComment).toBe(false);
    expect(result.current.isStudentViewingOwnNote).toBe(false);
  });
});
