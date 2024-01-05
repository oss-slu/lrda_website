import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteListView from '../lib/components/note_listview';

describe('NoteListView', () => {
  const mockNotes = [
    { id: 1, title: 'Note 1', content: 'Content 1' },
    { id: 2, title: 'Note 2', content: 'Content 2' },
    { id: 3, title: 'Note 3', content: 'Content 3' },
  ];

  it('renders without crashing', () => {
    render(<NoteListView notes={mockNotes} onNoteSelect={jest.fn()} />);
  });

  it('displays the list of notes', () => {
    render(<NoteListView notes={mockNotes} onNoteSelect={jest.fn()} />);

    expect(screen.getByText('Note 1')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
    expect(screen.getByText('Note 3')).toBeInTheDocument();
  });

  it('calls the onNoteSelect function when a note is selected', () => {
    const mockOnNoteSelect = jest.fn();
    render(<NoteListView notes={mockNotes} onNoteSelect={mockOnNoteSelect} />);

    fireEvent.click(screen.getByText('Note 1'));

    expect(mockOnNoteSelect).toHaveBeenCalledWith(mockNotes[0]);
  });
});