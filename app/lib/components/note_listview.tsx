// note_listview.tsx
import React, { useState, useEffect } from "react";
import { User } from "../models/user_class";
import ApiService from "../utils/api_service";
import { Note } from "../../types";
import { Button } from "@/components/ui/button";

type NoteListViewProps = {
  onNoteSelect: (noteText: string) => void;
};

const NoteListView: React.FC<NoteListViewProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const fetchNotes = async () => {
      const user = User.getInstance();
      const userId = await user.getId();
      if (userId) {
        try {
          const userNotes = await ApiService.fetchMessages(
            false,
            false,
            userId
          );
          setNotes(userNotes);
        } catch (error) {
          console.error("Error fetching notes:", error);
          // Handle the error as appropriate for your application
        }
      }
    };

    fetchNotes();
  }, []);

  const handleLoadText = (noteText: string) => {
    onNoteSelect(noteText);
  };

  return (
    <div className="my-4 flex flex-col">
      {notes.map((note) => {
        console.log(note);

        return (
          <Button key={note.id} className="bg-secondary text-primary p-2 m-1" onClick={() => handleLoadText(note.BodyText)}>
            <h3 className="text-lg font-semibold">{note.title}</h3>
            {/* <p>{note.BodyText}</p> */}
          </Button>
        );
      })}
    </div>
  );
};

export default NoteListView;
