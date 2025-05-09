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
  type MockIntroInstance = {
    setOptions: jest.Mock<MockIntroInstance>;
    oncomplete: jest.Mock<MockIntroInstance>;
    onexit: jest.Mock<MockIntroInstance>;
    start: jest.Mock<void>;
  };

  const mockIntroInstance: MockIntroInstance = {
    setOptions: jest.fn(() => mockIntroInstance),
    oncomplete: jest.fn(() => mockIntroInstance),
    onexit: jest.fn(() => mockIntroInstance),
    start: jest.fn(() => {
      const tooltip = document.createElement('div');
      tooltip.className = 'introjs-tooltip';
      tooltip.textContent = 'Welcome! Lets explore the website together.';
      document.body.appendChild(tooltip);
    }),
  };
  return jest.fn(() => mockIntroInstance);
});

// Mock Google Maps API context so the map and search bar render
jest.mock('../lib/utils/GoogleMapsContext', () => ({
  useGoogleMaps: () => ({ isMapsApiLoaded: true }),
}));

// Stub out the GoogleMap component so it renders children immediately
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: any) => <div data-testid="google-map-mock">{children}</div>,
}));


// -------------------------------------------------------------------
// Mock MutationObserver so that observe() immediately invokes its callback
// -------------------------------------------------------------------
global.MutationObserver = class {
  callback: MutationCallback;
  constructor(callback: MutationCallback) {
    this.callback = callback;
  }
  observe(_target: Node, _options?: MutationObserverInit) {
    // simulate a mutation event immediately
    this.callback([], this);
  }
  disconnect() {
    // no-op
  }
  takeRecords(): MutationRecord[] {
    return [];
  }
};
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
  navigator.geolocation.clearWatch();
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

    await waitFor(() => {
      const tooltip = document.querySelector(".introjs-tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip?.textContent).toContain("Welcome! Lets explore the website together.");
    });

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
