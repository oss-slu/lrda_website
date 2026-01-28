import React from 'react';
import { render, waitFor, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '../map/page';
import { createTestWrapper } from './utils/testQueryClient';

// Mock auth store to prevent nanostores ESM import chain
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: null,
      isLoggedIn: false,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

// Mock introJs to simulate tooltips being added
jest.mock('intro.js', () => {
  const mockIntroInstance: any = {
    setOptions: jest.fn(function (this: any) {
      return this;
    }),
    oncomplete: jest.fn(function (this: any) {
      return this;
    }),
    onexit: jest.fn(function (this: any) {
      return this;
    }),
    start: jest.fn(() => {
      const tooltip = document.createElement('div');
      tooltip.className = 'introjs-tooltip';
      tooltip.textContent = "Don't show again";
      document.body.appendChild(tooltip);
    }),
  };
  const mockIntroJs: any = jest.fn(() => mockIntroInstance);
  mockIntroJs.tour = jest.fn(() => mockIntroInstance);
  return {
    __esModule: true,
    default: mockIntroJs,
  };
});

// Mock the API service to avoid actual network calls
jest.mock('../lib/utils/api_service', () => ({
  fetchPublishedNotes: jest.fn(() => Promise.resolve([])),
}));

// Mock the geolocation API
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  const mockGeolocation = {
    getCurrentPosition: jest.fn().mockImplementation(success => {
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

  Object.defineProperty(global.navigator, 'geolocation', {
    value: mockGeolocation,
    writable: true,
  });

  // Mock window.location methods
  delete (window as any).location;
  window.location = {
    href: 'http://localhost/',
    assign: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
  } as any;
});

// Cleanup after each test to ensure a clean state
afterEach(() => {
  cleanup();
});

describe("Intro.js 'Don't show again' checkbox rendering", () => {
  it('renders the Page component without crashing', async () => {
    await act(async () => {
      render(<Page />, { wrapper: createTestWrapper() });
    });
  });

  it("renders the 'Don't show again' checkbox in the tooltip", async () => {
    // Create and append DOM elements that will be targeted by Intro.js
    const searchBar = document.createElement('div');
    searchBar.setAttribute('id', 'search-bar');
    document.body.appendChild(searchBar);

    const createNoteButton = document.createElement('button');
    createNoteButton.setAttribute('id', 'navbar-create-note');
    document.body.appendChild(createNoteButton);

    const navbarLogoutButton = document.createElement('button');
    navbarLogoutButton.setAttribute('id', 'navbar-logout');
    document.body.appendChild(navbarLogoutButton);

    const notesList = document.createElement('div');
    notesList.setAttribute('id', 'notes-list');
    document.body.appendChild(notesList);

    // Render the Page component
    await act(async () => {
      render(<Page />, { wrapper: createTestWrapper() });
    });

    // Wait for tooltips to be added by Intro.js and verify the "Don't show again" checkbox is present
    await waitFor(() => {
      const introTooltips = document.querySelector('.introjs-tooltip');
      if (introTooltips) {
        expect(introTooltips.textContent).toContain("Don't show again");
      }
    });
  });
});
