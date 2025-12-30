import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// A simple self-contained batching component to test
function MockBatchedNoteList({ notes }: { notes: any[] }) {
  const [visibleCount, setVisibleCount] = React.useState(15);
  const visibleNotes = notes.slice(0, visibleCount);
  const canLoadMore = visibleCount < notes.length;

  return (
    <div>
      {visibleNotes.map((note) => (
        <div key={note.id} data-testid="note">{note.title}</div>
      ))}
      {canLoadMore && (
        <button onClick={() => setVisibleCount(visibleCount + 15)}>
          Load More
        </button>
      )}
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe('MockBatchedNoteList batching with batch size 15', () => {
  const generateMockNotes = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `note-${i}`,
      title: `Note ${i}`,
    }));

  it('shows only the first 15 notes initially', () => {
    const notes = generateMockNotes(40);
    render(<MockBatchedNoteList notes={notes} />);
    expect(screen.getAllByTestId('note')).toHaveLength(15);
  });

  it('loads 15 more notes when "Load More" is clicked', () => {
    const notes = generateMockNotes(40);
    render(<MockBatchedNoteList notes={notes} />);
    fireEvent.click(screen.getByText(/load more/i));
    expect(screen.getAllByTestId('note')).toHaveLength(30);
  });

  it('hides the "Load More" button when all notes are shown', () => {
    const notes = generateMockNotes(30);
    render(<MockBatchedNoteList notes={notes} />);
    fireEvent.click(screen.getByText(/load more/i));
    expect(screen.queryByText(/load more/i)).toBeNull();
    expect(screen.getAllByTestId('note')).toHaveLength(30);
  });
});
