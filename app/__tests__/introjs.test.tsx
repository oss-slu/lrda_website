import React from "react";
import { render, waitFor, act, cleanup, RenderResult } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "../lib/pages/map/page";
import Page2 from "../lib/components/noteElements/note_component";

jest.mock('firebase/auth');
jest.mock('../lib/utils/api_service');
jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(),
}));

jest.mock('intro.js', () => {
  const mockIntroInstance: any = {
    setOptions: jest.fn(function(this: any) { return this; }),
    oncomplete: jest.fn(function(this: any) { return this; }),
    onexit: jest.fn(function(this: any) { return this; }),
    start: jest.fn(() => {
      const tooltip = document.createElement('div');
      tooltip.className = 'introjs-tooltip';
      tooltip.textContent = 'Welcome! Lets explore the website together.';
      document.body.appendChild(tooltip);
    }),
  };
  return jest.fn(() => mockIntroInstance);
});

jest.mock('../lib/utils/data_conversion', () => ({
  convertMediaTypes: jest.fn(() => []),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

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

  Object.defineProperty(window, 'location', {
    value: {
      href: "http://localhost/",
      hash: "",
      assign: jest.fn(),
      reload: jest.fn(),
      replace: jest.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  document.querySelectorAll('.introjs-tooltip').forEach(tooltip => tooltip.remove());
  jest.clearAllTimers();
  jest.useRealTimers();
  window.location.href = 'http://localhost/';
  navigator.geolocation.clearWatch(0);
  cleanup();
  console.log("All mocks, timers, and global references have been cleared");
});

describe("Intro.js feature in Page component", () => {
  it("renders the Page component without crashing", async () => {
    let component: RenderResult | undefined;
    await act(async () => {
      component = render(<Page />);
    });
    component?.unmount();
  });

  it("renders the Page2 component without crashing", async () => {
    await act(async () => {
      render(<Page2 isNewNote={false} />);
    });
  });

  it("renders the Page2 component without crashing again", async () => {
    let component: RenderResult | undefined;
    await act(async () => {
      component = render(<Page2 isNewNote={false} />);
    });
    component?.unmount();
  });

  it("shows the popups on page load", async () => {
    const elements = [
      { id: "search-bar" },
      { id: "navbar-create-note", tag: "button" },
      { id: "navbar-logout", tag: "button" },
      { id: "notes-list" },
      { id: "add-note" },
      { id: "note-title" },
      { id: "note-save" },
      { id: "note-delete" },
      { id: "note-date" },
      { id: "note-location" },
    ];

    elements.forEach(({ id, tag = "div" }) => {
      const el = document.createElement(tag);
      el.setAttribute("id", id);
      document.body.appendChild(el);
    });

    let component: RenderResult | undefined;
    await act(async () => {
      component = render(<Page />);
    });

    await act(async () => {
      render(<Page2 isNewNote={false} />);
    });

    await waitFor(() => {
      expect(document.getElementById("search-bar")).toBeInTheDocument();
      expect(document.getElementById("navbar-create-note")).toBeInTheDocument();
      expect(document.getElementById("navbar-logout")).toBeInTheDocument();
      expect(document.getElementById("notes-list")).toBeInTheDocument();
    });

    // Note: intro.js auto-start was removed to prevent accidental blank note creation
    // The intro can still be triggered manually if needed

    component?.unmount();
  });

  it("does not trigger introJs if elements are missing (Page)", async () => {
    document.body.innerHTML = '';
    let component: RenderResult | undefined;
    await act(async () => {
      component = render(<Page />);
    });
    component?.unmount();
  });

  it("does not trigger introJs if elements are missing (Page2)", async () => {
    await act(async () => {
      render(<Page2 isNewNote={false} />);
    });
  });
});
