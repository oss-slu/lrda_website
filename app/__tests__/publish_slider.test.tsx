import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import Sidebar from '../lib/components/side_bar';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(),
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

describe('Publish and Unpublish Notes Slider', () => {
  let mockPush;

  beforeEach(() => {
    mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
  });

  //Commented tests still need to be rewritten to test the Tabs UI component instead of a Switch.

  it('renders the sidebar correctly with the toggle', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const tabsElement = screen.getByRole('tablist');
    expect(tabsElement).toBeInTheDocument();
  });

  it('displays the correct labels for published and unpublished notes', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedLabel = screen.getByText('Published');
    const unpublishedLabel = screen.getByText('Unpublished');
    expect(publishedLabel).toBeInTheDocument();
    expect(unpublishedLabel).toBeInTheDocument();
  });

  /*
  it('toggles between published and unpublished notes correctly', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const tabsElement = screen.getByRole('tablist');
    expect(tabsElement).toBeChecked(); // Default state should be published

    fireEvent.click(switchElement);
    expect(switchElement).not.toBeChecked(); // Should switch to unpublished

    fireEvent.click(switchElement);
    expect(switchElement).toBeChecked(); // Should switch back to published
  });
  */

  it('ensures the toggle does not interfere with the search bar', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const searchBar = screen.getByRole('textbox');
    expect(searchBar).toBeInTheDocument();
  });

  /*
  it('ensures clicking the toggle does not crash the application', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const switchElement = screen.getByRole('switch');
    expect(() => fireEvent.click(switchElement)).not.toThrow();
  });

  it('ensures the switch remains functional after multiple clicks', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const switchElement = screen.getByRole('switch');
  
    // Click the switch an odd number of times
    fireEvent.click(switchElement); // unchecked
    fireEvent.click(switchElement); // checked
    fireEvent.click(switchElement); // unchecked
    fireEvent.click(switchElement); // checked
    fireEvent.click(switchElement); // unchecked
  
    // Assert that the final state matches expectations (odd clicks = unchecked, even clicks = checked)
    expect(switchElement).not.toBeChecked();
  });
  

  it('ensures the slider does not affect other UI components', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const addButton = screen.getByTestId('add-note-button');
    expect(addButton).toBeInTheDocument();

    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    expect(addButton).toBeInTheDocument(); // Ensure it's still present after interaction
  });

  it('ensures no visual glitches after toggling', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const switchElement = screen.getByRole('switch');

    fireEvent.click(switchElement);
    fireEvent.click(switchElement);

    const publishedLabel = screen.getByText('Published');
    const unpublishedLabel = screen.getByText('Unpublished');

    expect(publishedLabel).toBeInTheDocument();
    expect(unpublishedLabel).toBeInTheDocument();
  });
  */
});
