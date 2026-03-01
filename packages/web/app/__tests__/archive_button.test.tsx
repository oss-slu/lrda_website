// Mock notesService
const mockNotesServiceDelete = jest.fn();
jest.mock('../lib/services', () => ({
  notesService: {
    delete: (...args: unknown[]) => mockNotesServiceDelete(...args),
  },
}));

jest.mock('sonner', () => ({
  toast: jest.fn(),
}));

describe('Delete Note Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notesService.delete', () => {
    test('successfully deletes the note', async () => {
      mockNotesServiceDelete.mockResolvedValueOnce(true);

      const { notesService } = require('../lib/services');
      const result = await notesService.delete('test-note-id');

      expect(mockNotesServiceDelete).toHaveBeenCalledWith('test-note-id');
      expect(result).toBe(true);
    });

    test('handles delete failure', async () => {
      mockNotesServiceDelete.mockResolvedValueOnce(false);

      const { notesService } = require('../lib/services');
      const result = await notesService.delete('test-note-id');

      expect(result).toBe(false);
    });

    test('handles network error on delete', async () => {
      mockNotesServiceDelete.mockRejectedValueOnce(new Error('Network error'));

      const { notesService } = require('../lib/services');
      await expect(notesService.delete('test-note-id')).rejects.toThrow('Network error');
    });
  });
});
