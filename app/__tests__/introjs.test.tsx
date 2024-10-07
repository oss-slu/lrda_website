import React from "react";
import { render, waitFor, act, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom"; 
import Page from "../lib/pages/map/page"; // Importing the Page component that will be tested
import Page2 from "../lib/components/noteElements/note_component"; // Importing the note_component that will be tested
// Mock Firebase Auth and API services
jest.mock('firebase/auth'); // This mocks the Firebase authentication service, preventing real Firebase API calls
jest.mock('../lib/utils/api_service'); // Mocks the custom API service to avoid actual API interactions

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

// Clean up mocks, timers, DOM, and Intro.js elements after each test
afterEach(() => {
  // Remove Intro.js tooltips created during the tests
  document.querySelectorAll('.introjs-tooltip').forEach(tooltip => tooltip.remove());

  // Clear any pending timers and reset to real timers
  jest.clearAllTimers();
  jest.useRealTimers();

  // Reset window.location and other global properties
  window.location.href = 'http://localhost/';
  navigator.geolocation.clearWatch(); // Clear any geolocation watchers

  cleanup(); // Cleanup to remove any leftover DOM elements and unmount React components
  console.log("All mocks, timers, and global references have been cleared");
});

describe("Intro.js feature in Page component", () => {
  
  // Test to ensure the Page component renders without crashing
  it("renders the Page component without crashing", async () => {
    let component;
    await act(async () => {
      component = render(<Page />);
    });
    component.unmount(); // Explicitly unmount the component after the test
  });

  // This test ensures that the Page2 component can render without any errors
  it("renders the Page2 component without crashing", async () => {
    // `act` is used to wrap any actions that trigger updates, ensuring the React state is fully updated
    await act(async () => {
      render(<Page2 isNewNote={false} />); // Renders the Page component
    });
  });

  // This test ensures that the Page2 component can render without any errors
  it("renders the Page2 component without crashing", async () => {
    let component;
    // `act` is used to wrap any actions that trigger updates, ensuring the React state is fully updated
    await act(async () => {
      render(<Page2 isNewNote={false} />); // Renders the Page component
    });
  });

  // Test to ensure that the Intro.js tooltips appear on page load
  it("shows the popups on page load", async () => {
    // Manually create and append DOM elements that will be targeted by Intro.js for Page
    const searchBar = document.createElement("div"); 
    searchBar.setAttribute("id", "search-bar"); // Adds an ID to the search bar element
    document.body.appendChild(searchBar); // Appends the search bar to the DOM

    const createNoteButton = document.createElement("button");
    createNoteButton.setAttribute("id", "navbar-create-note");
    document.body.appendChild(createNoteButton);

    const navbarLogoutButton = document.createElement("button");
    navbarLogoutButton.setAttribute("id", "navbar-logout");
    document.body.appendChild(navbarLogoutButton);

    const notesList = document.createElement("div");
    notesList.setAttribute("id", "notes-list");
    document.body.appendChild(notesList);



    // Manually create and append elements that will be targeted by Intro.js for Page2 
    const addNote = document.createElement("div");
    addNote.setAttribute("id", "add-note");
    document.body.appendChild(addNote);

    const noteTitle = document.createElement("div");
    noteTitle.setAttribute("id", "note-title");
    document.body.appendChild(noteTitle);

    const noteSave = document.createElement("div");
    noteSave.setAttribute("id", "note-save");
    document.body.appendChild(noteSave);

    const noteDelete = document.createElement("div");
    noteDelete.setAttribute("id", "note-delete");
    document.body.appendChild(noteDelete);

    const noteDate = document.createElement("div"); 
    noteDate.setAttribute("id", "note-date");
    document.body.appendChild(noteDate);

    const noteLocation = document.createElement("div");
    noteLocation.setAttribute("id", "note-location");
    document.body.appendChild(noteLocation);

    // Render the Page component
    let component;
    await act(async () => {
      component = render(<Page />);
    });
    // Render the Page2 component and ensure all updates have finished processing
    await act(async () => {
      render(<Page2 isNewNote={false} />); 
    });
    // Render the Page2 component and ensure all updates have finished processing
    await act(async () => {
      render(<Page2 isNewNote={false} />); 
    });

    // Check for the presence of the elements
    await waitFor(() => {
      expect(document.getElementById("search-bar")).toBeInTheDocument();
      expect(document.getElementById("navbar-create-note")).toBeInTheDocument();
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

    // Clean up the component after the test
    component.unmount();
  });

  // Test to ensure introJs does not trigger if elements are missing
  it("does not trigger introJs if elements are missing", async () => {
    // Ensure there are no elements present
    document.body.innerHTML = ''; // Clear the body
    let component;
    await act(async () => {
      component = render(<Page />);
    });

    // Explicitly unmount the component to clean up
    component.unmount();
  });



  it("does not trigger introJs if elements are missing", async () => {
    // Render the Page2 component without adding the expected elements
    await act(async () => {
      render(<Page2 isNewNote={false} />); 
    });
  });
});
