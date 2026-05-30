/**
 * Tests for useNotePermissions using auth store data directly.
 *
 * These tests verify that:
 * 1. Student permissions (canComment, isStudentViewingOwnNote) work using
 *    only auth store data -- no API call needed.
 * 2. Permissions work even on refresh before session is re-validated.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotePermissions } from '../components/NoteEditor/hooks/useNotePermissions';
import type { Note } from '@/types';

// Mock services
vi.mock('../services', () => ({
  fetchCreatorName: vi.fn().mockResolvedValue('Unknown'),
}));

const mockAuthState: Record<string, any> = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isInitialized: true,
};

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (state: any) => any) => {
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
  latitude: null,
  longitude: null,
  published: false,
  tags: [],
  uid: 'student-1',
  ...overrides,
});

describe('useNotePermissions - store-based permissions', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.isLoggedIn = false;
    mockAuthState.isLoading = false;
    mockAuthState.isInitialized = true;
  });

  test('student with instructorId can comment on own note (no API call needed)', () => {
    // Student has instructorId in their auth store data
    mockAuthState.user = {
      id: 'student-1',
      name: 'Student User',
      email: 'student@example.com',
      role: 'user',
      isInstructor: false,
      instructorId: 'instructor-1',
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-1' });

    const { result } = renderHook(() => useNotePermissions(note));

    // Hook is synchronous (useMemo) -- assert directly without waitFor
    expect(result.current.userId).toBe('student-1');
    expect(result.current.isStudent).toBe(true);
    expect(result.current.canComment).toBe(true);
    expect(result.current.isStudentViewingOwnNote).toBe(true);
    expect(result.current.isInstructorUser).toBe(false);
  });

  test('instructor can comment on student note', () => {
    mockAuthState.user = {
      id: 'instructor-1',
      name: 'Instructor User',
      email: 'instructor@example.com',
      role: 'user',
      isInstructor: true,
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-1' });

    const { result } = renderHook(() => useNotePermissions(note));

    expect(result.current.userId).toBe('instructor-1');
    expect(result.current.isInstructorUser).toBe(true);
    expect(result.current.canComment).toBe(true);
    expect(result.current.isViewingStudentNote).toBe(true);
    expect(result.current.isStudentViewingOwnNote).toBe(false);
  });

  test('admin can comment', () => {
    mockAuthState.user = {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      isInstructor: false,
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-1' });

    const { result } = renderHook(() => useNotePermissions(note));

    expect(result.current.userId).toBe('admin-1');
    expect(result.current.isInstructorUser).toBe(true);
    expect(result.current.canComment).toBe(true);
  });

  test('student without instructorId cannot comment', () => {
    mockAuthState.user = {
      id: 'student-2',
      name: 'Standalone Student',
      email: 'standalone@example.com',
      role: 'user',
      isInstructor: false,
      // No instructorId
    };
    mockAuthState.isLoggedIn = true;

    const note = makeNote({ creator: 'student-2' });

    const { result } = renderHook(() => useNotePermissions(note));

    expect(result.current.userId).toBe('student-2');
    expect(result.current.isStudent).toBe(false);
    expect(result.current.canComment).toBe(false);
    expect(result.current.isStudentViewingOwnNote).toBe(false);
  });
});
