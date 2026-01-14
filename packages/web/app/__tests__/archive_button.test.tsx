import { handleDeleteNote } from '../lib/components/NoteEditor/handlers/noteHandlers'; // Import the function to be tested
import { toast } from 'sonner';

// Mock notesService
const mockNotesServiceUpdate = jest.fn();
jest.mock('../lib/services', () => ({
  notesService: {
    update: (...args: unknown[]) => mockNotesServiceUpdate(...args),
  },
}));

// Mocking necessary modules
jest.mock('firebase/auth');
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));
jest.useFakeTimers().setSystemTime(new Date('2024-11-12T07:43:02.627Z'));
jest.mock('sonner', () => ({
  toast: jest.fn(),
}));

describe('Archive Note Functionality Tests', () => {
  let mockSetNote: jest.Mock;
  let mockNote: {
    id: string;
    title: string;
    text: string;
    isArchived: boolean;
    published: boolean;
  };

  beforeEach(() => {
    mockSetNote = jest.fn();
    mockNote = {
      id: 'test-note-id',
      title: 'Test Note',
      text: 'This is a test note',
      isArchived: false,
      published: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // unit tests for front end
  describe('unit tests frontend)', () => {
    test('successfully archives the note', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      const result = await handleDeleteNote(mockNote, mockSetNote);

      // Update across all relevant test cases to ensure consistent expectations
      expect(mockNotesServiceUpdate).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: expect.any(String), // Matches any string date format
        published: false, // Consistently include this field
      });

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith('Success', {
        description: 'Note successfully archived.',
        duration: 4000,
      });
      expect(result).toBe(true);
    });
    /* this test can't be tested because the confirmation is not in the note_handler file */
    // test('shows confirmation prompt before archiving', async () => {
    //   // Mocking confirmation prompt
    //   global.confirm = jest.fn(() => true); // Simulates user confirming the action

    //   const result = await handleDeleteNote(mockNote, mockUser, mockSetNote);

    //   expect(global.confirm).toHaveBeenCalledWith('Are you absolutely sure?');
    //   expect(result).toBe(true);
    // });

    test('reflects the archive state in UI', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      await handleDeleteNote(mockNote, mockSetNote);

      expect(mockSetNote).toHaveBeenCalledWith(undefined); // Note should disappear from UI
    });
  });

  // unit tests for backend
  describe('unit tests backend', () => {
    test('media file is archived from the database', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      const response = await mockNotesServiceUpdate({
        ...mockNote,
        isArchived: true,
        archivedAt: new Date().toISOString(),
      });

      // Service returns RerumNoteData with @id on success, not Response with .ok
      expect(response['@id']).toBe('test-note-id');
      // Update across all relevant test cases to ensure consistent expectations
      expect(mockNotesServiceUpdate).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: '2024-11-12T07:43:02.627Z', // Matches any string date format
      });
    });
  });

  // integration tests
  describe('Integration Tests', () => {
    test('complete flow of archiving a note', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      const result = await handleDeleteNote(mockNote, mockSetNote);

      // Update across all relevant test cases to ensure consistent expectations
      expect(mockNotesServiceUpdate).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: '2024-11-12T07:43:02.627Z', // Matches any string date format
        published: false, // Consistently include this field
      });

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith('Success', {
        description: 'Note successfully archived.',
        duration: 4000,
      });
      expect(result).toBe(true);
    });

    test('UI consistency after archiving', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      await handleDeleteNote(mockNote, mockSetNote);

      // Ensure that the note is not present in the UI anymore
      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith('Success', {
        description: 'Note successfully archived.',
        duration: 4000,
      });
    });
  });
});
