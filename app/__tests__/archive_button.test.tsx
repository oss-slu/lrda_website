import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import NoteEditor from '../lib/components/noteElements/note_archive'; //this can be changed depending on what file justin writes
import ApiService from '../lib/utils/api_service';
import { act } from 'react-dom/test-utils';
import { User } from '../lib/models/user_class';

// Mock the necessary modules and components
jest.mock('../lib/utils/api_service');
jest.mock('../lib/models/user_class');

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    if (message.includes("validateDOMNesting")) {
      return;
    }
    console.warn("Console error suppressed in tests:", message);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const mockNote = {
  id: 'note-id',
  title: 'Test Note',
  text: 'This is a test note',
  media: [],
  tags: [],
  audio: [],
  isPublished: false,
};

test('Archive button prompts confirmation before archive', async () => {
  render(<NoteEditor note={mockNote} isNewNote={false} />);
  
  // Simulate clicking the archive/delete button
  fireEvent.click(screen.getByText('Delete')); // "Delete" is the text on the button

  // Make sure that the confirmation dialog appears
  expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
  expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();

  // Make sure that clicking the cancel button works 
  // and confirm the note isn't archived
  fireEvent.click(screen.getByText('Cancel'));
  await waitFor(() => {
    expect(screen.queryByText('Are you absolutely sure?')).not.toBeInTheDocument();
  });
});

test('Successfully archives a note and removes it from the frontend', async () => {
  ApiService.archiveNote.mockResolvedValueOnce({ success: true });

  render(<NoteEditor note={mockNote} isNewNote={false} />);

  // Simulate clicking the archive button
  fireEvent.click(screen.getByText('Delete'));

  // Confirm the archive action
  fireEvent.click(screen.getByText('Continue'));

  // Check that ApiService.archiveNote is called with the correct note ID
  await waitFor(() => {
    expect(ApiService.archiveNote).toHaveBeenCalledWith(mockNote.id);
  });

  // Make sure that the note is removed from the frontend
  await waitFor(() => {
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
  });
});

test('Displays error if archive fails', async () => {
  ApiService.archiveNote.mockRejectedValueOnce(new Error('Archive failed'));

  render(<NoteEditor note={mockNote} isNewNote={false} />);

  fireEvent.click(screen.getByText('Delete'));

  fireEvent.click(screen.getByText('Continue'));

  await waitFor(() => {
    expect(ApiService.archiveNote).toHaveBeenCalledWith(mockNote.id);
  });

  // Assert an error message is shown
  await waitFor(() => {
    expect(screen.getByText('Failed to archive note. Try again later.')).toBeInTheDocument();
  });
});

test('UI remains consistent after a note is archived', async () => {
  ApiService.archiveNote.mockResolvedValueOnce({ success: true });

  render(<NoteEditor note={mockNote} isNewNote={false} />);

  fireEvent.click(screen.getByText('Delete'));

  fireEvent.click(screen.getByText('Continue'));

  // Check that the note disappears and UI remains consistent
  await waitFor(() => {
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
  });

  // Check that other UI elements remain unaffected
  expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
  expect(screen.getByText('Save')).toBeInTheDocument();
});

test('Backend correctly archives the note and related data', async () => {
  ApiService.archiveNote.mockResolvedValueOnce({ success: true });

  // Simulate backend note archiving
  render(<NoteEditor note={mockNote} isNewNote={false} />);

  // Simulate clicking the archive button
  fireEvent.click(screen.getByText('Delete'));
  fireEvent.click(screen.getByText('Continue'));

  // Wait for backend API call and ensure it is made
  await waitFor(() => {
    expect(ApiService.archiveNote).toHaveBeenCalledWith(mockNote.id);
  });
});

// Integration test for archiving a note with associated media and annotations
/* FUTURE WORK: Implement this test after the basic implementation is working
test('Associated media and annotations are archived correctly', async () => {
  ApiService.archiveNote.mockResolvedValueOnce({ success: true });

  // Mock the note with media and annotations
  const mockNoteWithMedia = {
    ...mockNote,
    media: [{ id: 'media1', type: 'image', uri: 'image1.jpg' }],
    annotations: [{ id: 'annotation1', text: 'Test annotation' }],
  };

  render(<NoteEditor note={mockNoteWithMedia} isNewNote={false} />);

  // Simulate clicking the archive button
  fireEvent.click(screen.getByText('Delete'));
  fireEvent.click(screen.getByText('Continue'));

  // Assert that both the note and associated media/annotations are archived
  await waitFor(() => {
    expect(ApiService.archiveNote).toHaveBeenCalledWith(mockNoteWithMedia.id);
  });

  // Check that media and annotations are also removed
  expect(ApiService.archiveNote).toHaveBeenCalledWith(mockNoteWithMedia.id);
});
*/

test('Integration test for archiving a note', async () => {
  ApiService.archiveNote.mockResolvedValueOnce({ success: true });

  render(<NoteEditor note={mockNote} isNewNote={false} />);

  // Simulate full flow: click delete, confirm archive, note disappears
  fireEvent.click(screen.getByText('Delete'));
  fireEvent.click(screen.getByText('Continue'));

  // Wait for the note to be archived in the backend and removed from the frontend
  await waitFor(() => {
    expect(ApiService.archiveNote).toHaveBeenCalledWith(mockNote.id);
  });

  // Check that the note is removed from the frontend
  await waitFor(() => {
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
  });
});
