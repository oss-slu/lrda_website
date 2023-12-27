// NoteCard.tsx
import React from 'react';
import { Note } from '@/app/types';

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const  title  = note.title;
  const text = note.text;
  const imageMedia = note.media.filter(media => media.type === 'image')[0];

  return (
    <div className="note-card-container bg-white rounded-lg shadow-lg overflow-hidden flex flex-col" style={{ width: '280px', height: '280px' }}>
      <div className="flex-shrink-0">
      {imageMedia && (
        <div className="flex-shrink-0">
          <img src={imageMedia.uri} alt={note.title} className="w-full h-48 object-cover" />
        </div>
      )}
      </div>
      <div className="p-4 flex flex-col justify-between flex-grow">
        <h3 className="text-lg font-semibold truncate">{title}</h3>
        <p className="text-sm text-gray-500">{"1/22/3333"}</p>
        <p className="text-sm text-gray-500 truncate">{"123 Grand Blvd"}</p>
        <div className="flex justify-between items-end mt-2">
          <p className="text-lg font-bold">{"$500,000"}</p>
          <p className="text-sm line-clamp-3">{"I can't render HTML haha"}</p>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
