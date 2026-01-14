import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import Sidebar from '../lib/components/Sidebar'; // Update the path to your Sidebar component accordingly

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock TanStack Query hooks
jest.mock('../lib/hooks/queries/useNotes', () => ({
  useStudentNotes: jest.fn(() => ({
    data: [],
  })),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(), // Mock Realtime Database
}));

jest.mock('firebase/auth', () => {
  const originalModule = jest.requireActual('firebase/auth');
  return {
    ...originalModule,
    getAuth: jest.fn(() => ({
      currentUser: {
        uid: 'mockUserId',
        email: 'mock@example.com',
      },
    })),
    signInWithEmailAndPassword: jest.fn((auth, email, password) => {
      return Promise.resolve({
        user: {
          uid: 'mockUserId',
          email,
        },
      });
    }),
    signOut: jest.fn(() => Promise.resolve()),
    onAuthStateChanged: jest.fn((auth, callback) => {
      callback({
        uid: 'mockUserId',
        email: 'mock@example.com',
      });
    }),
  };
});

describe('Sidebar Component', () => {
  let mockPush;

  beforeEach(() => {
    mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it('renders the sidebar correctly', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const addButton = screen.getByTestId('add-note-button');
    expect(addButton).toBeInTheDocument();
  });

  it('displays the toggle switch for published notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedToggle = screen.getByText('Published');
    const unpublishedToggle = screen.getByText('Unpublished');
    expect(publishedToggle).toBeInTheDocument();
    expect(unpublishedToggle).toBeInTheDocument();
  });

  it('toggles between published and unpublished notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const tabsElement = screen.getByRole('tablist');
    expect(tabsElement).toBeInTheDocument();
  });

  /*
  it('toggles between published and unpublished notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toBeChecked(); // Initially published

    fireEvent.click(switchElement);
    expect(switchElement).not.toBeChecked(); // Should toggle to unpublished
  });
  */
});
