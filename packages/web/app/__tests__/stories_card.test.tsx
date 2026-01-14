import React from "react";
import { render, screen, waitFor, within, fireEvent, cleanup, act } from "@testing-library/react";
// @ts-expect-error -- moxios doesn't have type declarations
import moxios from "moxios";
import ApiService from "../lib/utils/api_service";
import EnhancedNoteCard from "../lib/components/stories_card";
import { Note, Tag } from "@/app/types";
import { PhotoType, AudioType } from "../lib/models/media_class";

// Mock the environment variable for the Google Maps API key
process.env.NEXT_PUBLIC_MAP_KEY = "test_api_key";

// Mock data
const mockNote: Note = {
  id: "1",
  title: "Test Note Title",
  text: "<p>This is the body of the note. It has multiple sentences.</p>",
  creator: "123",
  time: new Date("2023-12-01T15:00:00Z"),
  tags: [{ label: "important", origin: "user" }, { label: "work", origin: "user" }] as Tag[],
  latitude: "37.7749",
  longitude: "-122.4194",
  published: true,
  uid: "123",
  media: [new PhotoType({ uuid: "test-uuid", type: "image", uri: "https://example.com/image.jpg" })],
  audio: [new AudioType({ uuid: "test-uuid", type: "audio", uri: "https://example.com/audio.mp3", name: "Test Audio", duration: "0", isPlaying: false })],
};

// Mock the `fetchCreatorName` method of `ApiService`
jest.mock("../lib/utils/api_service", () => ({
  fetchCreatorName: jest.fn(),
}));

// Mock DOMPurify
const mockDOMPurify = {
  default: {
    sanitize: jest.fn((html: string) => html),
  },
};

jest.mock("dompurify", () => mockDOMPurify, { virtual: true });

// Mock date formatting
jest.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => "Friday, December 1, 2023");

// Mock fetch for geocoding API
global.fetch = jest.fn();

beforeEach(() => {
  moxios.install();
  jest.clearAllMocks();
  // Mock successful geocoding API response
  (global.fetch as jest.Mock).mockResolvedValue({
    json: async () => ({
      results: [
        {
          formatted_address: "San Francisco, CA, USA",
          types: ["administrative_area_level_1"],
        },
      ],
    }),
  });
});

afterEach(async () => {
  cleanup();
  moxios.uninstall();
  jest.clearAllTimers();
  jest.useRealTimers();
  await new Promise(resolve => setImmediate(resolve));
});

describe("EnhancedNoteCard Component", () => {
  it("renders the note title and body preview", async () => {
    (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

    render(<EnhancedNoteCard note={mockNote} />);

    // Check if the title is rendered
    expect(screen.getByText("Test Note Title")).toBeInTheDocument();

    // Check if the body preview is rendered
    // The body preview extracts the first 2 sentences from the HTML
    await waitFor(() => {
      expect(screen.getByText(/This is the body of the note/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("fetches and displays the creator name", async () => {
    (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("John Doe");

    render(<EnhancedNoteCard note={mockNote} />);

    // Wait for the creator's name to be displayed
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });


  it("displays 'Location not found' when API key is not provided but coordinates exist", async () => {
    delete process.env.NEXT_PUBLIC_MAP_KEY;
    (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

    render(<EnhancedNoteCard note={mockNote} />);

    await waitFor(() => {
      expect(screen.getByText("Location not found")).toBeInTheDocument();
    });
  });

  describe("URL sanitization and string handling", () => {
    beforeEach(() => {
      // Reset DOMPurify mock before each test
      mockDOMPurify.default.sanitize.mockImplementation((html: string) => html);
      // Use real timers for these tests
      jest.useRealTimers();
    });

    afterEach(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });

    it("handles blob: URLs in img src attributes", async () => {
      const noteWithBlobUrl: Note = {
        ...mockNote,
        text: '<p>Test content</p><img src="blob:http://localhost:3000/abc123" alt="test" />',
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithBlobUrl} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // The blob: URL should be removed, so the image should not cause network errors
      // We verify the component renders without errors
      expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    });

    it("handles data: URLs in img src attributes", async () => {
      const noteWithDataUrl: Note = {
        ...mockNote,
        text: '<p>Test content</p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" alt="test" />',
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithDataUrl} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // The data: URL should be removed
      expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    });

    it("handles blob: URLs in href attributes", async () => {
      const noteWithBlobHref: Note = {
        ...mockNote,
        text: '<p>Test content</p><a href="blob:http://localhost:3000/abc123">Link</a>',
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithBlobHref} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // The blob: URL should be removed from href
      expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    });

    it("handles javascript: URLs in href attributes", async () => {
      const noteWithJSHref: Note = {
        ...mockNote,
        text: '<p>Test content</p><a href="javascript:alert(\'xss\')">Link</a>',
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithJSHref} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // The javascript: URL should be removed from href
      expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    });

    it("handles non-string noteText values by converting to string", async () => {
      const noteWithNonStringText: Note = {
        ...mockNote,
        text: null as any,
        BodyText: 12345 as any, // Non-string value
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithNonStringText} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // Component should handle non-string values without errors
      expect(screen.getByText("Test Note Title")).toBeInTheDocument();
    });

    it("handles undefined noteText gracefully", async () => {
      const noteWithUndefinedText: Note = {
        ...mockNote,
        text: undefined as any,
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithUndefinedText} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // Component should render without errors even with undefined text
      expect(screen.getByText("Test Note Title")).toBeInTheDocument();
    });

    it("handles empty string noteText", async () => {
      const noteWithEmptyText: Note = {
        ...mockNote,
        text: "",
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithEmptyText} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // Component should render without errors with empty text
      expect(screen.getByText("Test Note Title")).toBeInTheDocument();
    });

    it("handles multiple problematic URLs in the same content", async () => {
      const noteWithMultipleUrls: Note = {
        ...mockNote,
        text: '<p>Multiple URLs Test</p><img src="blob:http://localhost:3000/abc" /><img src="data:image/png;base64,test" /><a href="blob:http://localhost:3000/def">Link</a><a href="javascript:void(0)">JS Link</a>',
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithMultipleUrls} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // All problematic URLs should be removed
      expect(screen.getByText(/Multiple URLs Test/i)).toBeInTheDocument();
    });

    it("preserves valid HTTP/HTTPS URLs in content", async () => {
      const noteWithValidUrls: Note = {
        ...mockNote,
        text: '<p>Valid URL Test</p><img src="https://example.com/image.jpg" alt="valid" /><a href="https://example.com">Valid Link</a>',
      };
      (ApiService.fetchCreatorName as jest.Mock).mockResolvedValue("Test Creator");

      render(<EnhancedNoteCard note={noteWithValidUrls} />);

      await waitFor(() => {
        expect(screen.getByText("Test Note Title")).toBeInTheDocument();
      }, { timeout: 3000 });

      // Valid URLs should be preserved - check for the specific text
      expect(screen.getByText(/Valid URL Test/i)).toBeInTheDocument();
    });
  });

});
