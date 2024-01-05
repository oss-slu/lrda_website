// note_listview.tsx
import React, { useState, useEffect } from "react";
import { Note } from "../../types";
import { Button } from "@/components/ui/button";


type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note) => void;
};

const NoteListView: React.FC<NoteListViewProps> = ({  notes, onNoteSelect }) => {
  const [fresh, setFresh] = useState(true);

  useEffect(() => {
    if (notes.length > 0 && fresh) {
      onNoteSelect(notes[0]);
      setFresh(false);
    }
  }, [notes, onNoteSelect]);

  const handleLoadText = (note: Note) => {
    onNoteSelect(note);
  };

  return (
    <div className="my-4 flex flex-col">
      {notes.map((note) => {
        return (
          <Button
            key={note.id}
            className="bg-secondary text-primary p-2 m-1 z-10"
            onClick={() => handleLoadText(note)}
          >
            <h3 className="text-lg font-semibold">{note.title}</h3>
          </Button>
        );
      })}
    </div>
  );
};

export default NoteListView;
