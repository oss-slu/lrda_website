import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import moxios from "moxios";
import ApiService from "../lib/utils/api_service";
import EnhancedNoteCard from "../lib/components/stories_card";
import { Note } from "@/app/types";

// Mock the environment variable for the Google Maps API key
process.env.NEXT_PUBLIC_MAP_KEY = "test_api_key";

const mockNote: Note = {
  id: "1",
  title: "Test Note Title",
  BodyText: "<p>This is the body of the note. It has multiple sentences.</p>",
  creator: "123",
  time: new Date("2023-12-01T15:00:00Z"),
  tags: [
    { label: "important", origin: "user" },
    { label: "work", origin: "user" },
  ],
  latitude: "37.7749",
  longitude: "-122.4194",
  media: [{ type: "image", uri: "https://example.com/image.jpg" }],
  audio: [{ uri: "https://example.com/audio.mp3", label: "Test Audio" }],
};



// Mock the `fetchCreatorName` method of `ApiService`
jest.mock("../lib/utils/api_service", () => ({
  fetchCreatorName: jest.fn(),
}));

// Mock date formatting
jest.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => "Friday, December 1, 2023");

// Set up before and after hooks
beforeEach(() => {
  moxios.install();
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

afterEach(() => {
  moxios.uninstall();
  jest.restoreAllMocks();
});

describe("EnhancedNoteCard Component", () => {

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
