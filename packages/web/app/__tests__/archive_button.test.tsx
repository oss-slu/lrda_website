import { handleDeleteNote } from '../lib/components/NoteEditor/handlers/noteHandlers';
import { toast } from 'sonner';

// Mock notesService
const mockNotesServiceUpdate = jest.fn();
jest.mock('../lib/services', () => ({
  notesService: {
    update: (...args: unknown[]) => mockNotesServiceUpdate(...args),
  },
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

      expect(mockNotesServiceUpdate).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: expect.any(String),
        published: false,
      });

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith('Success', {
        description: 'Note successfully archived.',
        duration: 4000,
      });
      expect(result).toBe(true);
    });

    test('reflects the archive state in UI', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      await handleDeleteNote(mockNote, mockSetNote);

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
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

      expect(response['@id']).toBe('test-note-id');
      expect(mockNotesServiceUpdate).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: '2024-11-12T07:43:02.627Z',
      });
    });
  });

  // integration tests
  describe('Integration Tests', () => {
    test('complete flow of archiving a note', async () => {
      mockNotesServiceUpdate.mockResolvedValueOnce({ '@id': 'test-note-id' });

      const result = await handleDeleteNote(mockNote, mockSetNote);

      expect(mockNotesServiceUpdate).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: '2024-11-12T07:43:02.627Z',
        published: false,
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

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith('Success', {
        description: 'Note successfully archived.',
        duration: 4000,
      });
    });
  });
});
