import React from "react";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
// @ts-ignore - moxios doesn't have types
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

afterEach(() => {
  moxios.uninstall();
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


  it("displays 'API Key Missing' when API key is not provided", async () => {
    delete process.env.NEXT_PUBLIC_MAP_KEY;

    render(<EnhancedNoteCard note={mockNote} />);

    await waitFor(() => {
      expect(screen.getByText("API Key Missing")).toBeInTheDocument();
    });
  });

});
