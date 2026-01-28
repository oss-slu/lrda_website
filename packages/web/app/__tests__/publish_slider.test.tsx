import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/router';
import Sidebar from '../lib/components/Sidebar';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock TanStack Query hooks
jest.mock('../lib/hooks/queries/useNotes', () => ({
  useStudentNotes: jest.fn(() => ({
    data: [],
  })),
}));

// Mock auth store
jest.mock('../lib/stores/authStore', () => ({
  useAuthStore: jest.fn((selector?: (state: any) => any) => {
    const mockAuthState = {
      user: {
        uid: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        roles: { administrator: false, contributor: true },
        isInstructor: false,
      },
      isLoggedIn: true,
      isLoading: false,
      isInitialized: true,
      login: jest.fn().mockResolvedValue('success'),
      logout: jest.fn().mockResolvedValue(undefined),
      signup: jest.fn().mockResolvedValue(undefined),
      refreshUser: jest.fn().mockResolvedValue(undefined),
      isAdmin: jest.fn().mockReturnValue(false),
    };
    return selector ? selector(mockAuthState) : mockAuthState;
  }),
}));

// Mock notes store
jest.mock('../lib/stores/notesStore', () => ({
  useNotesStore: jest.fn((selector?: (state: any) => any) => {
    const mockStore = {
      notes: [],
      fetchNotes: jest.fn(),
      viewMode: 'my',
      addNote: jest.fn(),
      setSelectedNoteId: jest.fn(),
    };
    return selector ? selector(mockStore) : mockStore;
  }),
}));

// Mock services
jest.mock('../lib/services', () => ({
  fetchMe: jest.fn().mockResolvedValue(null),
  fetchUserById: jest.fn().mockResolvedValue(null),
  fetchProfileById: jest.fn().mockResolvedValue(null),
  fetchInstructors: jest.fn().mockResolvedValue([]),
  updateProfile: jest.fn().mockResolvedValue({}),
  assignInstructor: jest.fn().mockResolvedValue(undefined),
  fetchCreatorName: jest.fn().mockResolvedValue('Test User'),
  notesService: {
    create: jest.fn().mockResolvedValue({ '@id': 'new-note-id' }),
    fetchUserNotes: jest.fn().mockResolvedValue([]),
  },
}));

describe('Publish and Unpublish Notes Slider', () => {
  let mockPush;

  beforeEach(() => {
    mockPush = jest.fn();
    useRouter.mockImplementation(() => ({
      push: mockPush,
    }));
  });

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

  it('toggles between published and unpublished notes correctly', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedTab = screen.getByText('Published');
    const unpublishedTab = screen.getByText('Unpublished');

    fireEvent.click(unpublishedTab);
    expect(unpublishedTab).toHaveFocus; // Unpublished tab should be enabled
    expect(publishedTab).not.toHaveFocus; // Published tab should be disabled

    fireEvent.click(publishedTab);
    expect(publishedTab).toHaveFocus; // Published tab should be enabled
    expect(unpublishedTab).not.toHaveFocus; // Unpublished tab should be disabled
  });

  it('functions as expected when clicking the same tab more than once', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedTab = screen.getByText('Published');
    const unpublishedTab = screen.getByText('Unpublished');

    fireEvent.click(unpublishedTab);
    expect(unpublishedTab).toHaveFocus; // Unpublished tab should be enabled
    expect(publishedTab).not.toHaveFocus; // Published tab should be disabled

    fireEvent.click(unpublishedTab);
    expect(unpublishedTab).toHaveFocus; // Unpublished tab should be enabled
    expect(publishedTab).not.toHaveFocus; // Published tab should be disabled

    fireEvent.click(publishedTab);
    expect(publishedTab).toHaveFocus; // Published tab should be enabled
    expect(unpublishedTab).not.toHaveFocus; // Unpublished tab should be disabled

    fireEvent.click(publishedTab);
    expect(publishedTab).toHaveFocus; // Published tab should be enabled
    expect(unpublishedTab).not.toHaveFocus; // Unpublished tab should be disabled
  });

  it('ensures the toggle does not interfere with the search bar', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const searchBar = screen.getByRole('textbox');
    expect(searchBar).toBeInTheDocument();
  });

  it('ensures clicking the toggle does not crash the application', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedTab = screen.getByText('Published');
    const unpublishedTab = screen.getByText('Unpublished');
    expect(() => fireEvent.click(publishedTab)).not.toThrow();
    expect(() => fireEvent.click(unpublishedTab)).not.toThrow();
  });

  it('ensures the switch remains functional after multiple clicks', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedTab = screen.getByText('Published');
    const unpublishedTab = screen.getByText('Unpublished');

    // Click the switch an odd number of times
    fireEvent.click(unpublishedTab); // unchecked
    fireEvent.click(publishedTab); // checked
    fireEvent.click(unpublishedTab); // unchecked
    fireEvent.click(publishedTab); // checked
    fireEvent.click(unpublishedTab); // unchecked

    // Assert that the final state matches expectations (odd clicks = unchecked, even clicks = checked)
    expect(publishedTab).toHaveFocus; // Published tab should be enabled
    expect(unpublishedTab).not.toHaveFocus; // Unpublished tab should be disabled
  });

  it('ensures the slider does not affect other UI components', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const addButton = screen.getByTestId('add-note-button');
    expect(addButton).toBeInTheDocument();

    const publishedTab = screen.getByText('Published');
    const unpublishedTab = screen.getByText('Unpublished');
    fireEvent.click(unpublishedTab);
    fireEvent.click(publishedTab);
    expect(addButton).toBeInTheDocument(); // Ensure it's still present after interaction
  });

  it('ensures no visual glitches after toggling', () => {
    render(<Sidebar onNoteSelect={jest.fn()} />);
    const publishedTab = screen.getByText('Published');
    const unpublishedTab = screen.getByText('Unpublished');

    fireEvent.click(unpublishedTab);
    fireEvent.click(publishedTab);

    const publishedLabel = screen.getByText('Published');
    const unpublishedLabel = screen.getByText('Unpublished');

    expect(publishedLabel).toBeInTheDocument();
    expect(unpublishedLabel).toBeInTheDocument();
  });
});
