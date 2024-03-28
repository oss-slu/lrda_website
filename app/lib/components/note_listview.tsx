import React, { useState, useEffect } from "react";
import { Note } from "../../types";
import { format12hourTime } from "../utils/data_conversion";

type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
};

const extractTextFromHtml = (htmlString: string) => {
  const tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = htmlString;
  return tempDivElement.textContent || tempDivElement.innerText || "";
};

const NoteListView: React.FC<NoteListViewProps> = ({ notes, onNoteSelect }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  useEffect(() => {
    if (notes.length > 0 && fresh) {
      onNoteSelect(notes[0], false);
      setSelectedNoteId(notes[0].id);
      setFresh(false);
    }
  }, [notes, onNoteSelect, fresh]);

  const handleLoadText = (note: Note) => {
    onNoteSelect(note, false);
    setSelectedNoteId(note.id);
  };

  const handleGetTime = (inputDate: Date) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(inputDate.getTime());
    checkDate.setHours(0, 0, 0, 0);
    const dayDifference = (currentDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDifference === 0) {
      return format12hourTime(inputDate);
    } else if (dayDifference === 1) {
      return "Yesterday";
    } else {
      return inputDate.toLocaleDateString();
    }
  };

  return (
    <div className="my-4 flex flex-col">
      {notes.map((note) => {
        const noteTextContent = extractTextFromHtml(note.text);

        return (
          <div
            key={note.id}
            className={`h-16 p-2 m-1 z-10 rounded truncate ${
              note.id === selectedNoteId
                ? "bg-primary/80 text-popover"
                : "bg-popover text-primary"
            }`}
            onClick={() => handleLoadText(note)}
          >
            <div className="flex flex-col">
              <div className="flex flex-row items-center text-center justify-between">
                <h3 className="text-lg font-semibold truncate">{note.title}</h3>
                <h3 className="text-sm font-semibold">
                  {handleGetTime(note.time)}
                </h3>
              </div>
              <p className="text-sm truncate">{noteTextContent}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NoteListView;
