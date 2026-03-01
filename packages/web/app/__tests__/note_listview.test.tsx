import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteListView from '../lib/components/note_listview';

// Mock auth store - inline to avoid hoisting issues
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isInstructor: false,
      },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
      login: jest.fn().mockResolvedValue('success'),
      logout: jest.fn().mockResolvedValue(undefined),
      signup: jest.fn().mockResolvedValue(undefined),
      initialize: jest.fn(),
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

// Mock notes store
jest.mock('../lib/stores/notesStore', () => ({
  useNotesStore: jest.fn((selector?: (state: any) => any) => {
    const mockStore = {
      selectedNoteId: null,
      setSelectedNoteId: jest.fn(),
    };
    return selector ? selector(mockStore) : mockStore;
  }),
}));

// Mock services - inline to avoid hoisting issues
jest.mock('../lib/services', () => ({
  fetchMe: jest.fn().mockResolvedValue(null),
  fetchProfileById: jest.fn().mockResolvedValue(null),
  fetchInstructors: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue({}),
  assignInstructor: jest.fn().mockResolvedValue(undefined),
  fetchCreatorName: jest.fn().mockResolvedValue('Test User'),
}));

describe('NoteListView', () => {
  const mockNotes = [
    {
      id: '1',
      title: 'Note 1',
      text: 'Content 1',
      time: new Date(),
      creator: 'user-1',
      media: [],
      audio: [],
      latitude: null,
      longitude: null,
      published: false,
      tags: [],
      uid: 'user-1',
    },
    {
      id: '2',
      title: 'Note 2',
      text: 'Content 2',
      time: new Date(),
      creator: 'user-1',
      media: [],
      audio: [],
      latitude: null,
      longitude: null,
      published: false,
      tags: [],
      uid: 'user-1',
    },
    {
      id: '3',
      title: 'Note 3',
      text: 'Content 3',
      time: new Date(),
      creator: 'user-1',
      media: [],
      audio: [],
      latitude: null,
      longitude: null,
      published: false,
      tags: [],
      uid: 'user-1',
    },
  ];

  it('renders without crashing', () => {
    render(<NoteListView notes={mockNotes} onNoteSelect={jest.fn()} />);
  });

  it('displays the list of notes', () => {
    render(<NoteListView notes={mockNotes} onNoteSelect={jest.fn()} />);

    mockNotes.forEach(note => {
      expect(screen.getByText(note.title)).toBeInTheDocument();
    });
  });

  it('calls the onNoteSelect function with false for isNewNote when a note is clicked', () => {
    const mockOnNoteSelect = jest.fn();
    render(<NoteListView notes={mockNotes} onNoteSelect={mockOnNoteSelect} />);

    fireEvent.click(screen.getByText('Note 1'));

    expect(mockOnNoteSelect).toHaveBeenCalledWith(mockNotes[0], false);
  });

  it('calls the onNoteSelect function with the first note and false for isNewNote on initial render', () => {
    const mockOnNoteSelect = jest.fn();
    render(<NoteListView notes={mockNotes} onNoteSelect={mockOnNoteSelect} />);

    expect(mockOnNoteSelect).toHaveBeenCalledWith(mockNotes[0], false);
  });
});
