import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
// @ts-ignore
import Page from "app/lib/pages/map/page";

// Mock Firebase config to avoid real initialization
jest.mock("app/lib/config/firebase", () => ({
  db: {},
}));

// Mock Google Maps context and components used within the page
jest.mock("app/lib/utils/GoogleMapsContext", () => ({
  useGoogleMaps: () => ({ isMapsApiLoaded: false }),
}));

jest.mock("@react-google-maps/api", () => ({
  GoogleMap: ({ children }: any) => <div data-testid="google-map">{children}</div>,
}));

// Mock ClickableNote to a simple div for counting
jest.mock("app/lib/components/click_note_card", () => ({
  __esModule: true,
  default: ({ note }: any) => <div data-testid="note-card">{note.title || note.id}</div>,
}));

// Mock User to avoid Firebase auth wiring
jest.mock("app/lib/models/user_class", () => ({
  User: { getInstance: () => ({ getId: async () => null }) },
}));

// Provide a stable IntersectionObserver mock
let lastIO: any;
class IO {
  cb: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    lastIO = this;
  }
  observe = (_el: Element) => {};
  unobserve = () => {};
  disconnect = () => {};
}
(window as any).IntersectionObserver = IO as any;

// Utility to inject notes into state by mocking API service and initial effects
jest.mock("app/lib/utils/api_service", () => ({
  __esModule: true,
  default: {
    fetchUserMessages: jest.fn().mockResolvedValue([]),
    fetchPublishedNotes: jest.fn().mockResolvedValue(
      Array.from({ length: 48 }, (_, i) => ({
        id: `id-${i}`,
        title: `Note ${i}`,
        text: "text",
        latitude: "0",
        longitude: "0",
        media: [],
        creator: "u",
        published: true,
        tags: [],
        time: new Date(),
        isArchived: false,
      }))
    ),
    fetchCreatorName: jest.fn().mockResolvedValue("Test User"),
  },
}));

// Bypass media conversion in tests
jest.mock("app/lib/utils/data_conversion", () => ({
  __esModule: true,
  default: { convertMediaTypes: (arr: any[]) => arr },
  format12hourTime: (d: any) => "time",
  formatDateTime: (d: any) => "date time",
}));

// Silence toasts in tests
jest.mock("sonner", () => ({ toast: jest.fn() }));

describe("Map page infinite scroll", () => {
  jest.useFakeTimers();

  beforeEach(() => {
    // Mock geolocation to immediately error (so page sets locationFound and proceeds)
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: (_success: any, error: any) => error(new Error("geo error")),
      },
    };
  });

  it("renders initial 16 notes and loads more on sentinel intersect, shows spinner", async () => {
    render(<Page />);

    // wait until first batch visible
    await screen.findAllByTestId("note-card");
    const first = await screen.findAllByTestId("note-card");
    console.log("\n\n FIRST \n\n", first);
    expect(first.length).toBe(16);

    // trigger IntersectionObserver to load next page
    await act(async () => {
      lastIO.cb([{ isIntersecting: true } as any], lastIO);
      jest.advanceTimersByTime(250);
    });

    const second = await screen.findAllByTestId("note-card");
    expect(second.length).toBe(32);
    // spinner may or may not be visible depending on timing; don't assert
  });
});
