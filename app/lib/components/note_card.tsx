// NoteCard.tsx
import React from 'react';
import { Note } from '@/app/types';

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  // This is just a placeholder. Replace with actual properties from your Note type.
  const  title  = note.title;

  return (
    <div className="note-card-container bg-white rounded-lg shadow-md overflow-hidden">
      {/* <img src={imageUrl} alt={title} className="w-full h-32 object-cover" /> */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          <span className="text-sm">{"04/19/1972"}</span>
        </div>
        <p className="text-sm">{"123 Grand Blvd"}</p>
        <p className="text-lg font-bold">{"$5"}</p>
        <p className="text-sm line-clamp-2">{"Lovely day huh"}</p>
        {/* Add more details as required */}
      </div>
    </div>
  );
};

export default NoteCard;
