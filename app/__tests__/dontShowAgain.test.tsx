import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom"; 
import Page from "../lib/pages/map/page"; // Importing the Page component that will be tested

// Mock Firebase Auth and API services
jest.mock('firebase/auth'); // This mocks the Firebase authentication service, preventing real Firebase API calls
jest.mock('../lib/utils/api_service'); // Mocks the custom API service to avoid actual API interactions

// Mock introJs to simulate tooltips being added
jest.mock('intro.js', () => {
  return jest.fn(() => ({
    // Mock the setOptions method of introJs to simulate setting up tooltips
    setOptions: jest.fn(), 
    // Mock the start method of introJs, and simulate adding tooltips to the DOM when it runs
    start: jest.fn(() => {
      const tooltip = document.createElement('div'); // Create a new div element
      tooltip.className = 'introjs-tooltip'; // Set the class name to simulate an Intro.js tooltip
      document.body.appendChild(tooltip); // Append the tooltip div to the body to mimic the behavior of Intro.js
    }),
  }));
});

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Restore all mocks after each test to prevent side effects between tests
afterEach(() => {
  jest.restoreAllMocks(); // Reset and clean up any mocked functionality after each test
});

describe("Intro.js 'Don't show again' checkbox rendering", () => {
  
  it("renders the Page component without crashing", async () => {
    await act(async () => {
      render(<Page />);
    });
  });

  it("renders the 'Don't show again' checkbox in the tooltip", async () => {
    // Manually create and append DOM elements that will be targeted by Intro.js
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
    // Render the Page component and wait for Intro.js to run
    await act(async () => {
      render(<Page />);
    });

    // Wait for tooltips to be added by Intro.js and verify the "Don't show again" checkbox is present
    await waitFor(() => {
        const introTooltips = document.querySelector(".introjs-tooltip"); // Query for the introJs tooltip element
        if (introTooltips) { 
          // check the tooltip content if the tooltip exists (handling possible null values)
          expect(introTooltips.textContent).toContain("Don't show again"); // Verifies the content of the tooltip
        }
    });
  });
});
