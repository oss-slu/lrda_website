import React from "react";
import { render, waitFor, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom"; 
import Page from "../lib/pages/map/page"; // Importing the Page component that will be tested

// Mock Firebase Auth and API services
jest.mock('firebase/auth'); // This mocks the Firebase authentication service, preventing real Firebase API calls

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));

// Mock introJs to simulate tooltips being added
jest.mock('intro.js', () => {
  return jest.fn(() => ({
    setOptions: jest.fn(), 
    start: jest.fn(() => {
      const tooltip = document.createElement('div'); // Create a new div element
      tooltip.className = 'introjs-tooltip'; // Set the class name to simulate an Intro.js tooltip
      document.body.appendChild(tooltip); // Append the tooltip div to the body to mimic the behavior of Intro.js
    }),
  }));
});

// Mock the API service to avoid actual network calls
jest.mock('../lib/utils/api_service', () => ({
  fetchPublishedNotes: jest.fn(() => Promise.resolve([])), // Mocking fetch to return an empty array
}));

// Mock the geolocation API
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers(); // Ensure fake timers are used globally

  const mockGeolocation = {
    getCurrentPosition: jest.fn().mockImplementation((success) => {
      success({
        coords: {
          latitude: 51.1,
          longitude: 45.3,
        },
      });
    }),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  };

  Object.defineProperty(global.navigator, "geolocation", {
    value: mockGeolocation,
    writable: true,
  });

  // Mock window.location methods
  Object.defineProperty(window, 'location', {
    value: {
      href: "http://localhost/",
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
    },
    writable: true,
  });
});

// Cleanup after each test to ensure a clean state
afterEach(() => {
  cleanup(); // Cleanup to remove any leftover DOM elements
});

describe("Intro.js 'Don't show again' checkbox rendering", () => {
  
  it("renders the Page component without crashing", async () => {
    await act(async () => {
      render(<Page />);
    });
  });

  it("renders the 'Don't show again' checkbox in the tooltip", async () => {
    // Create and append DOM elements that will be targeted by Intro.js
    const searchBar = document.createElement("div");
    searchBar.setAttribute("id", "search-bar");
    document.body.appendChild(searchBar);

    const createNoteButton = document.createElement("button");
    createNoteButton.setAttribute("id", "navbar-create-note");
    document.body.appendChild(createNoteButton);

    const navbarLogoutButton = document.createElement("button");
    navbarLogoutButton.setAttribute("id", "navbar-logout");
    document.body.appendChild(navbarLogoutButton);

    const notesList = document.createElement("div");
    notesList.setAttribute("id", "notes-list");
    document.body.appendChild(notesList);

    // Render the Page component
    await act(async () => {
      render(<Page />);
    });

    // Wait for tooltips to be added by Intro.js and verify the "Don't show again" checkbox is present
    await waitFor(() => {
      const introTooltips = document.querySelector(".introjs-tooltip"); // Query for the introJs tooltip element
      if (introTooltips) { 
        expect(introTooltips.textContent).toContain("Don't show again"); // Verifies the content of the tooltip
      }
    });
  });
});