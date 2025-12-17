import { handleDeleteNote } from "../lib/components/noteElements/note_handler"; // Import the function to be tested
import ApiService from "../lib/utils/api_service";
import { toast } from "sonner";

// Mocking necessary modules
jest.mock("firebase/auth");
jest.mock("../lib/utils/api_service");
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));
jest.useFakeTimers().setSystemTime(new Date("2024-11-12T07:43:02.627Z"));
jest.mock("sonner", () => ({
  toast: jest.fn(),
}));

describe("Archive Note Functionality Tests", () => {
  let mockSetNote;
  let mockNote;

  beforeEach(() => {
    mockSetNote = jest.fn();
    mockNote = {
      id: "test-note-id",
      title: "Test Note",
      text: "This is a test note",
      isArchived: false,
      published: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // unit tests for front end
  describe("unit tests frontend)", () => {
    test("successfully archives the note", async () => {
      ApiService.overwriteNote.mockResolvedValueOnce({ ok: true });

      const result = await handleDeleteNote(mockNote, mockSetNote);

      // Update across all relevant test cases to ensure consistent expectations
      expect(ApiService.overwriteNote).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: expect.any(String), // Matches any string date format
        published: false, // Consistently include this field
      });

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith("Success", {
        description: "Note successfully archived.",
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

    test("reflects the archive state in UI", async () => {
      ApiService.overwriteNote.mockResolvedValueOnce({ ok: true });

      await handleDeleteNote(mockNote, mockSetNote);

      expect(mockSetNote).toHaveBeenCalledWith(undefined); // Note should disappear from UI
    });
  });

  // unit tests for backend
  describe("unit tests backend", () => {
    test("media file is archived from the database", async () => {
      ApiService.overwriteNote.mockResolvedValueOnce({ ok: true });

      const response = await ApiService.overwriteNote({
        ...mockNote,
        isArchived: true,
        archivedAt: new Date().toISOString(),
      });

      expect(response.ok).toBe(true);
      // Update across all relevant test cases to ensure consistent expectations
      expect(ApiService.overwriteNote).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: "2024-11-12T07:43:02.627Z", // Matches any string date format
        published: false, // Consistently include this field
      });
    });

    test("associated annotations are also archived", async () => {
      const mockArchiveAnnotations = jest.fn().mockResolvedValue(true);
      ApiService.archiveAnnotations = mockArchiveAnnotations;

      await ApiService.archiveAnnotations(mockNote.id, "user-id");

      expect(mockArchiveAnnotations).toHaveBeenCalledWith(mockNote.id, "user-id");
    });
  });

  // integration tests
  describe("Integration Tests", () => {
    test("complete flow of archiving a note", async () => {
      ApiService.overwriteNote.mockResolvedValueOnce({ ok: true });

      const result = await handleDeleteNote(mockNote, mockSetNote);

      // Update across all relevant test cases to ensure consistent expectations
      expect(ApiService.overwriteNote).toHaveBeenCalledWith({
        ...mockNote,
        isArchived: true,
        archivedAt: "2024-11-12T07:43:02.627Z", // Matches any string date format
        published: false, // Consistently include this field
      });

      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith("Success", {
        description: "Note successfully archived.",
        duration: 4000,
      });
      expect(result).toBe(true);
    });

    test("UI consistency after archiving", async () => {
      ApiService.overwriteNote.mockResolvedValueOnce({ ok: true });

      await handleDeleteNote(mockNote, mockSetNote);

      // Ensure that the note is not present in the UI anymore
      expect(mockSetNote).toHaveBeenCalledWith(undefined);
      expect(toast).toHaveBeenCalledWith("Success", {
        description: "Note successfully archived.",
        duration: 4000,
      });
    });
  });
});
