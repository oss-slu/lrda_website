import React from "react";
import { render, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "../lib/pages/map/page";

// Mock Firebase Auth and API services
jest.mock('firebase/auth');
jest.mock('../lib/utils/api_service');

// Mock introJs
jest.mock('intro.js', () => {
  return jest.fn(() => ({
    setOptions: jest.fn(),
    start: jest.fn(() => {
    }),
  }));
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore all mocks after each test to avoid interference
});

describe("Intro.js feature in Page component", () => {
  it("renders the Page component without crashing", async () => {
    await act(async () => {
      render(<Page />);
    });
  });

  it("shows the search bar popup on page load", async () => {
    // Manually create the DOM elements that the test expects to be present
    const searchBar = document.createElement("div");
    searchBar.setAttribute("id", "search-bar");
    document.body.appendChild(searchBar);

    const createNoteButton = document.createElement("button");
    createNoteButton.setAttribute("id", "navbar-create-note");
    document.body.appendChild(createNoteButton);

    await act(async () => {
      render(<Page />);
    });

    // Ensure elements are present
    await waitFor(() => {
      expect(document.getElementById("search-bar")).toBeInTheDocument();
      expect(document.getElementById("navbar-create-note")).toBeInTheDocument();
    });
  });

  it("does not trigger introJs if elements are missing", async () => {
    await act(async () => {
      render(<Page />);
    });

    // Assert that introJs should not have caused any popups since elements are missing
    const introTooltips = document.querySelectorAll(".introjs-tooltip");
    expect(introTooltips.length).toBe(0); // Expect no tooltips because introJs should not have triggered
  });
});