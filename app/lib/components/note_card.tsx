import React, { useState, useEffect } from 'react';
import { Note } from '@/app/types';
import ApiService from '../utils/api_service';
import placeholderImage from 'public/no-photo-placeholder.jpeg';
import { formatDateTime } from '../utils/data_conversion';

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  
  const title = note.title;
  const date = formatDateTime(note.time);
  const text = note.text;
  const tags: string[] = note.tags;
  const imageMedia = note.media.filter(media => media.type === 'image')[0];
  const [creator, setCreator] = useState<string>('Loading...');

  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then(name => setCreator(name))
      .catch(error => {
        console.error('Error fetching creator name:', error);
        setCreator('Error loading name');
      });
  }, [note.creator]);


return (
  <div className="w-64 bg-white rounded-xl shadow-md overflow-hidden m-4 flex flex-col">
    <div className="h-32">
      {imageMedia ? (
        <img src={imageMedia.uri} alt={note.title} className="w-full h-full object-cover" />
      ) : (
        <img src={placeholderImage.src} alt="Placeholder" className="w-full h-full object-cover" />
      )}
    </div>
    <div className="p-4 flex flex-col justify-between">
      <h3 className="text-lg font-semibold truncate">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">{date.toString()}</p>
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        {
          /*
        {tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 h-5 text-xs px-2 font-semibold rounded flex justify-center items-center">
            {tag}
          </span>
        ))}
            */
}
      </div>
      <p className="text-lg font-bold truncate">{creator}</p>
    </div>
  </div>
);


};

export default NoteCard;
