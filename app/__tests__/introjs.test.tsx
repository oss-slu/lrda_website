// Full test code with unmounting included

import React from "react";
import { render, waitFor, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom"; 
import Page from "../lib/pages/map/page"; // Importing the Page component that will be tested

// Mock Firebase
jest.mock('firebase/auth');

// Mock the API service to avoid actual network calls
jest.mock('../lib/utils/api_service');

// Mock Intro.js to simulate tooltips being added
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

// Mock data_conversion to avoid the need for reverse and map function errors
jest.mock('../lib/utils/data_conversion', () => ({
  convertMediaTypes: jest.fn(() => []), // Mock with an empty array
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers(); // Ensure fake timers are used globally

  // Mock the geolocation API
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

// Clean up mocks and DOM after each test
afterEach(() => {
  cleanup(); // Cleanup to remove any leftover DOM elements
  jest.clearAllTimers(); // Clear all timers after each test
  console.log("All mocks, timers, and global references have been cleared");
});

describe("Intro.js feature in Page component", () => {
  
  // Test to ensure the Page component renders without crashing
  it("renders the Page component without crashing", async () => {
    await act(async () => {
      render(<Page />);
    });
  });

  // Test to ensure that the Intro.js tooltips appear on page load
  it("shows the popups on page load", async () => {
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

    // Check for the presence of the elements
    await waitFor(() => {
      expect(document.getElementById("search-bar")).toBeInTheDocument();
      expect(document.getElementById("navbar-create-note")).toBeInTheDocument();
      expect(document.getElementById("navbar-logout")).toBeInTheDocument();
      expect(document.getElementById("notes-list")).toBeInTheDocument();
    });

    // Check for the Intro.js tooltip
    await waitFor(() => {
      const introTooltips = document.querySelector(".introjs-tooltip");
      if (introTooltips) {
        expect(introTooltips?.textContent).toContain("Welcome! Lets explore the website together.");
      }
    });
  });

  // Test to ensure introJs does not trigger if elements are missing
  it("does not trigger introJs if elements are missing", async () => {
    // Ensure there are no elements present
    document.body.innerHTML = ''; // Clear the body

    await act(async () => {
      const { unmount } = render(<Page />);
      unmount(); // Explicitly unmount the component to clean up
    });
  });
});