import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import Sidebar from '../lib/components/side_bar'; // Update the path to your Sidebar component accordingly

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
jest.mock("firebase/database", () => ({
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
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockImplementation(() => ({
      push: mockPush,
    }));
  });

  it('renders the sidebar correctly', () => {
    render(<Sidebar setNoteComponentVisible={jest.fn()} />);
    // Query for a child element of the sidebar to confirm it's rendered
    const linkElement = screen.getByText('Add Note');
    expect(linkElement).toBeInTheDocument();
  });

  it('displays the "Add Note" link', () => {
    render(<Sidebar setNoteComponentVisible={jest.fn()} />);
    const linkElement = screen.getByText('Add Note');
    expect(linkElement).toBeInTheDocument();
  });
});
