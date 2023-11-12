// note_listview.tsx
import React, { useState, useEffect } from 'react';
import { User } from "../models/user_class";
import ApiService from '../utils/api_service';
import { Note } from '../../types'; 

const NoteListView: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      const user = User.getInstance();
      const userName = await user.getName();
      if (userName) {
        try {
          const userNotes = await ApiService.fetchMessages(false, true, userName);
          setNotes(userNotes);
        } catch (error) {
          console.error('Error fetching notes:', error);
          // Handle the error as appropriate for your application
        }
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="my-4">
      {notes.map((note) => (
        <div key={note.id} className="mb-2 p-2 bg-white rounded shadow">
          <h3 className="text-lg font-semibold">{note.title}</h3>
          <p>{note.text}</p>
          {/* Render other note properties as needed */}
        </div>
      ))}
    </div>
  );
};

export default NoteListView;
