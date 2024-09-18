import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import Page from "../lib/pages/map/page";
import introJs from "intro.js";

// Mock intro.js
jest.mock("intro.js", () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    setOptions: jest.fn(),
  }));
});

describe("Intro.js Popups", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear previous mock call history
  });

  it("shows the search bar popup on page load", async () => {
    // Arrange: Render the Page that includes the introjs popups
    await act(async () => {
      render(<Page />);
    });

    // Mock introJs call
    const mockIntroJs = introJs();
    expect(mockIntroJs.setOptions).toHaveBeenCalledWith({
      steps: [
        expect.objectContaining({
          intro: "This is the search bar. Use it to find locations on the map.",
        }),
        expect.objectContaining({
          intro: "You can add a note right here.",
        }),
      ],
      showBullets: false,
      scrollToElement: true,
    });

    // Act: Simulate intro.js starting
    await act(async () => {
      mockIntroJs.start();
    });

    // Assert: Check if the search bar popup message is displayed
    expect(screen.getByText(/This is the search bar/i)).toBeInTheDocument();
  });

  it("navigates to the add note popup after clicking next", async () => {
    await act(async () => {
      render(<Page />);
    });

    // Mock introJs call
    const mockIntroJs = introJs();

    // Act: Simulate clicking the "Next" button in the intro.js popup
    fireEvent.click(screen.getByText(/Next/i));

    // Assert: Ensure the next step of the tour is related to the "Add Note" popup
    expect(screen.getByText(/You can add a note right here/i)).toBeInTheDocument();
  });

  it("handles clicking next to navigate to the create note page", async () => {
    await act(async () => {
      render(<Page />);
    });

    const mockIntroJs = introJs();

    // Simulate starting the intro tour
    await act(async () => {
      mockIntroJs.start();
    });

    // Mock the behavior of navigating to the create note page
    fireEvent.click(screen.getByText(/Next/i));

    // Assert: Check if the URL changed or the navigation action was triggered (this can vary depending on your routing solution)
    expect(window.location.pathname).toBe("/lib/pages/notes");
  });
});
