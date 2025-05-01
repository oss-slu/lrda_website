import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '@/app/lib/pages/map/page';
import { GoogleMapsContext } from '@/app/utils/GoogleMapsContext';
import '@testing-library/jest-dom';
import { Note } from '@/app/types';

// Mock required components
jest.mock('@/app/components/search_bar_map', () => () => <div>MockSearchBarMap</div>);
jest.mock('@/app/components/click_note_card', () => ({ note }: { note: any }) => <div>{note.title}</div>);
jest.mock('@/app/utils/api_service', () => ({
  __esModule: true,
  default: {
    fetchUserMessages: jest.fn(() => Promise.resolve([])),
    fetchPublishedNotes: jest.fn(() => Promise.resolve([])),
    fetchMessages: jest.fn(() => Promise.resolve([])),
  },
}));
jest.mock('@/app/utils/data_conversion', () => ({
  __esModule: true,
  default: {
    convertMediaTypes: jest.fn((notes) => notes),
  },
}));
jest.mock('@/app/models/user_class', () => ({
  User: {
    getInstance: () => ({
      getId: jest.fn(() => Promise.resolve('test-user')),
    }),
  },
}));
jest.mock('intro.js', () => () => ({ setOptions: jest.fn(), start: jest.fn(), oncomplete: jest.fn(), onexit: jest.fn() }));

// Mock filtered notes
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Test Note',
    text: 'Text',
    time: new Date(),
    latitude: '0',
    longitude: '0',
    tags: [],
    isArchived: false,
    uid: 'user',
  },
];

describe('Map Page Fallback', () => {
  it('renders fallback note list view if map fails to load', () => {
    render(
      <GoogleMapsContext.Provider value={{ isMapsApiLoaded: false }}>
        <Page />
      </GoogleMapsContext.Provider>
    );

    expect(screen.getByText(/map failed to load/i)).toBeInTheDocument();
    expect(screen.getByText(/here's a list of notes/i)).toBeInTheDocument();
  });
});
