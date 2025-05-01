import React, { useState, useEffect } from "react";
import { Note } from "../../types";
import { format12hourTime } from "../utils/data_conversion";

type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
};

const BATCH_SIZE = 10;

const extractTextFromHtml = (htmlString: string) => {
  const tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = htmlString;
  return tempDivElement.textContent || tempDivElement.innerText || "";
};

const NoteListView: React.FC<NoteListViewProps> = ({ notes, onNoteSelect }) => {
  const visibleNotes = notes.filter(note => !note.isArchived);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    if (visibleNotes.length > 0 && fresh) {
      onNoteSelect(visibleNotes[0], false);
      setSelectedNoteId(visibleNotes[0].id);
      setFresh(false);
    }
  }, [visibleNotes, fresh, onNoteSelect]);

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

  const loadMoreNotes = () => {
    setVisibleCount(prev => prev + BATCH_SIZE);
  };

  return (
    <div id="notes-list" className="my-4 flex flex-col">
      {visibleNotes.slice(0, visibleCount).map((note) => {
        const noteTextContent = extractTextFromHtml(note.text);
        return (
          <div
            key={note.id}
            className={`h-16 p-2 m-1 z-10 rounded truncate cursor-pointer ${
              note.id === selectedNoteId
                ? "bg-primary/90 text-popover"
                : "bg-popover text-primary hover:bg-primary/80"
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

      {/* ✅ Button shows if more notes exist beyond current slice */}
      {visibleCount < visibleNotes.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={loadMoreNotes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteListView;
