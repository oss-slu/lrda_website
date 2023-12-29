import React from 'react';
import { Note } from '@/app/types';

interface NoteCardProps {
  note: Note;
}

function formatDateTime(date: Date) {
  if (!date) return 'Pick a date';

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const ampm = hours < 12 ? 'AM' : 'PM';

  return `${date.toDateString()} ${formattedHours}:${formattedMinutes} ${ampm}`;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  const title = note.title;
  const date = formatDateTime(note.time);
  const text = note.text;
  const creator = note.creator;
  const tags: string[] = note.tags;
  const imageMedia = note.media.filter(media => media.type === 'image')[0];

  return (
    // Use Tailwind's aspect ratio utilities to maintain a square shape
    // and other spacing utilities to handle the layout
    <div className="aspect-w-1 aspect-h-1 bg-white rounded-xl shadow-md overflow-hidden m-4 flex flex-col">
      {imageMedia && (
        <div className="flex-shrink-0 h-48">
          <img src={imageMedia.uri} alt={note.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col justify-between flex-grow">
        <h3 className="text-lg font-semibold truncate">{title}</h3>
        <p className="text-sm text-gray-500">{date.toString()}</p> 
         <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex justify-between items-end mt-2">
          <p className="text-lg font-bold">{note.creator}</p>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
