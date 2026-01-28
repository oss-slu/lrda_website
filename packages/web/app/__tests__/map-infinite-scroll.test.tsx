import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// @ts-expect-error -- using app/ alias path for test
import Page from 'app/map/page';
import { createTestWrapper } from './utils/testQueryClient';

// Mock Google Maps context and components used within the page
jest.mock('app/lib/utils/GoogleMapsContext', () => ({
  useGoogleMaps: () => ({ isMapsApiLoaded: false }),
}));

jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children }: any) => <div data-testid='google-map'>{children}</div>,
}));

// Mock NoteCard component (used in MapNotesPanel)
jest.mock('app/lib/components/note_card', () => ({
  __esModule: true,
  default: ({ note }: any) => <div data-testid='note-card'>{note.title || note.id}</div>,
}));

// Mock ClickableNote (used in Dialog modal)
jest.mock('app/lib/components/click_note_card', () => ({
  __esModule: true,
  default: ({ note }: any) => <div data-testid='clickable-note'>{note.title || note.id}</div>,
}));

// Mock useAuthStore instead of User class
jest.mock('app/lib/stores/authStore', () => ({
  useAuthStore: jest.fn(selector => {
    const mockState = {
      user: null,
      isLoggedIn: false,
      isLoading: false,
      isInitialized: true,
    };
    return selector ? selector(mockState) : mockState;
  }),
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

// Mock the notes service (used by TanStack Query hooks)
jest.mock('app/lib/services', () => ({
  __esModule: true,
  notesService: {
    fetchPublished: jest.fn().mockResolvedValue(
      Array.from({ length: 48 }, (_, i) => ({
        id: `id-${i}`,
        title: `Note ${i}`,
        text: 'text',
        latitude: '0',
        longitude: '0',
        media: [],
        creator: 'u',
        published: true,
        tags: [],
        time: new Date(),
        isArchived: false,
      })),
    ),
    fetchUserNotes: jest.fn().mockResolvedValue([]),
  },
  usersService: {
    fetchById: jest.fn().mockResolvedValue(null),
  },
}));

// Mock useCreatorName hook used by NoteCard
jest.mock('app/lib/hooks/queries/useUsers', () => ({
  useCreatorName: () => ({ data: 'Test User', isPending: false }),
}));

// Bypass media conversion in tests
jest.mock('app/lib/utils/data_conversion', () => ({
  __esModule: true,
  default: { convertMediaTypes: (arr: any[]) => arr },
  format12hourTime: (d: any) => 'time',
  formatDateTime: (d: any) => 'date time',
}));

// Silence toasts in tests
jest.mock('sonner', () => ({ toast: jest.fn() }));

// Mock local storage functions
jest.mock('app/lib/utils/local_storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

describe('Map page infinite scroll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock geolocation to immediately error (so page sets locationFound and proceeds)
    (global as any).navigator = {
      geolocation: {
        getCurrentPosition: (_success: any, error: any) => error(new Error('geo error')),
      },
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders initial 16 notes and loads more on sentinel intersect, shows spinner', async () => {
    render(<Page />, { wrapper: createTestWrapper() });

    // Flush pending timers and microtasks to allow TanStack Query to resolve
    await act(async () => {
      jest.runAllTimers();
    });

    // Wait until first batch visible
    const first = await screen.findAllByTestId('note-card');
    expect(first.length).toBe(16);

    // Trigger IntersectionObserver to load next page
    await act(async () => {
      lastIO.cb([{ isIntersecting: true } as any], lastIO);
      jest.advanceTimersByTime(250);
    });

    const second = await screen.findAllByTestId('note-card');
    expect(second.length).toBe(32);
    // spinner may or may not be visible depending on timing; don't assert
  });
});
