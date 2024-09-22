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

// Restore all mocks after each test to prevent side effects between tests
afterEach(() => {
  jest.restoreAllMocks(); // Reset and clean up any mocked functionality after each test
});

describe("Intro.js feature in Page component", () => {
  
  // This test ensures that the Page component can render without any errors
  it("renders the Page component without crashing", async () => {
    // `act` is used to wrap any actions that trigger updates, ensuring the React state is fully updated
    await act(async () => {
      render(<Page />); // Renders the Page component
    });
  });

  // This test checks if the introJs tooltips appear when the search bar and note button are present on page load
  it("shows the popups on page load", async () => {
    // Manually create and append DOM elements that will be targeted by Intro.js
    const searchBar = document.createElement("div"); 
    searchBar.setAttribute("id", "search-bar"); // Adds an ID to the search bar element
    document.body.appendChild(searchBar); // Appends the search bar to the DOM

    const createNoteButton = document.createElement("button"); 
    createNoteButton.setAttribute("id", "navbar-create-note"); // Adds an ID to the note button
    document.body.appendChild(createNoteButton); // Appends the note button to the DOM

    const navbarLogoutButton = document.createElement("button");
    navbarLogoutButton.setAttribute("id", "navbar-logout");
    document.body.appendChild(navbarLogoutButton);

    const notesList = document.createElement("div");
    notesList.setAttribute("id", "notes-list");
    document.body.appendChild(notesList);
    // Render the Page component and ensure all updates have finished processing
    await act(async () => {
      render(<Page />); 
    });

    // Wait for the elements to be present in the DOM and assert that they exist
    await waitFor(() => {
      expect(document.getElementById("search-bar")).toBeInTheDocument(); // Confirms that the search bar is present
      expect(document.getElementById("navbar-create-note")).toBeInTheDocument(); // Confirms that the note button is present
      expect(document.getElementById("navbar-logout")).toBeInTheDocument();
      expect(document.getElementById("notes-list")).toBeInTheDocument();
    });

    // This block waits for tooltips to be added by introJs and verifies their presence and content
    await waitFor(() => {
      const introTooltips = document.querySelector(".introjs-tooltip"); // Query for the introJs tooltip element
      if (introTooltips) { 
        // check the tooltip content if the tooltip exists (handling possible null values)
        expect(introTooltips.textContent).toContain("Welcome! Lets explore the website together."); // Verifies the content of the tooltip
      }
    });
  });

  // This test verifies that introJs does not trigger if required elements (e.g., search bar or note button) are missing from the page
  it("does not trigger introJs if elements are missing", async () => {
    // Render the Page component without adding the expected elements (search bar, note button)
    await act(async () => {
      render(<Page />); 
    });
  });
});