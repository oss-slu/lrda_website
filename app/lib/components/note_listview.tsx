// note_listview.tsx
import React from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
}

// Dummy data for the list
const notes: Note[] = [
  { id: 1, title: 'Note 1', content: 'Lorem ipsum dolor sit amet...' },
  { id: 2, title: 'Note 2', content: 'Consectetur adipiscing elit...' },
  { id: 3, title: 'Note 3', content: 'Sed do eiusmod tempor...' },
  // ... add as many notes as needed
];

const NoteListView: React.FC = () => {
  return (
    <div className="my-4">
      {notes.map((note) => (
        <div key={note.id} className="mb-2 p-2 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <p>{note.content}</p>
        </div>
      ))}
    </div>
  );
};

export default NoteListView;
