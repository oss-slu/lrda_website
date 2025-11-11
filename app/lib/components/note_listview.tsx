import React, { useState, useEffect } from "react";
import { Note } from "../../types";
import { format12hourTime } from "../utils/data_conversion";
import { Button } from "@/components/ui/button";
import { FileText, Search } from "lucide-react";

type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
  isSearching?: boolean;
};

const batch_size = 15; //can change batch loading here

const extractTextFromHtml = (htmlString: string) => {
  const tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = htmlString;
  return tempDivElement.textContent || tempDivElement.innerText || "";
};

const NoteListView: React.FC<NoteListViewProps> = ({ notes, onNoteSelect, isSearching = false }) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const visibleNotes = notes.filter(note => !note.isArchived); //filter out archived notes
  
  const [visibleCount, setVisibleCount] =  useState(batch_size);

  useEffect(() => {
    if (visibleNotes.length > 0 && fresh) {
      onNoteSelect(visibleNotes[0], false);
      setSelectedNoteId(visibleNotes[0].id);
      setFresh(false);
    }
  }, [visibleNotes, onNoteSelect, fresh]);

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

  const moreNotes = () => {
    setVisibleCount(prev => prev + batch_size);
  };

  // Empty state: no notes at all
  if (visibleNotes.length === 0 && !isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-blue-50 rounded-full p-4 mb-4">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes yet</h3>
        <p className="text-sm text-gray-600 mb-4 max-w-xs">
          Click the "New Note" button below to create your first note!
        </p>
      </div>
    );
  }

  // Empty state: search returned no results
  if (visibleNotes.length === 0 && isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-gray-50 rounded-full p-4 mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
        <p className="text-sm text-gray-600 max-w-xs">
          Try adjusting your search or check the other tab
        </p>
      </div>
    );
  }

  return (
    <div id="notes-list" className="my-4 flex flex-col">
      {visibleNotes.slice(0, visibleCount).map((note) => {
        const noteTextContent = extractTextFromHtml(note.text);
  
        return (
          <div
            key={note.id}
            className={`p-3 m-1 z-10 rounded-lg cursor-pointer transition-all duration-200 ${
              note.id === selectedNoteId
                ? "bg-blue-50 border border-blue-200 text-blue-900"
                : "bg-white hover:bg-gray-50 border border-gray-100 text-gray-900"
            }`}
            onClick={() => handleLoadText(note)}
          >
            <div className="flex flex-col space-y-1">
              <div className="flex flex-row items-start justify-between">
                <h3 className="text-sm font-semibold truncate flex-1 mr-2">
                  {note.title || "Untitled"}
                </h3>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {handleGetTime(note.time)}
                </span>
              </div>
              <p className="text-xs text-gray-600 truncate leading-relaxed">
                {noteTextContent}
              </p>
            </div>
          </div>
        );
      })}

      {visibleCount < visibleNotes.length && (
        <div className = "mt-4 flex justify-center">
          <button  
            onClick = {moreNotes}
            className = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Load More Notes...
          </button>
        </div>
      )}
    </div>
  );  
};



export default NoteListView;
