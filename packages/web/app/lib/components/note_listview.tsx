import React, { useState, useEffect } from "react";
import { Note, newNote } from "../../types";
import { format12hourTime } from "../utils/data_conversion";
import { FileText, Search, FileEdit } from "lucide-react";
import { useNotesStore } from "../stores/notesStore";
import { useShallow } from "zustand/react/shallow";
import ApiService from "../utils/api_service";

type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
  isSearching?: boolean;
  viewMode?: "my" | "review";
  isInstructor?: boolean;
  draftNote?: newNote | null;
  onDraftSelect?: () => void;
};

const batch_size = 15; //can change batch loading here

const extractTextFromHtml = (htmlString: string) => {
  const tempDivElement = document.createElement("div");
  tempDivElement.innerHTML = htmlString;
  return tempDivElement.textContent || tempDivElement.innerText || "";
};

const NoteListView: React.FC<NoteListViewProps> = ({ notes, onNoteSelect, isSearching = false, viewMode = "my", isInstructor = false, draftNote = null, onDraftSelect }) => {
  const { selectedNoteId, setSelectedNoteId, clearDraftNote } = useNotesStore(
    useShallow((state) => ({
      selectedNoteId: state.selectedNoteId,
      setSelectedNoteId: state.setSelectedNoteId,
      clearDraftNote: state.clearDraftNote,
    }))
  );
  const [fresh, setFresh] = useState(true);
  const [visibleCount, setVisibleCount] = useState(batch_size);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (notes.length > 0 && fresh) {
      onNoteSelect(notes[0], false);
      setSelectedNoteId(notes[0].id);
      setFresh(false);
    }
  }, [notes, onNoteSelect, fresh]);

  // Fetch creator names for instructors in review mode
  useEffect(() => {
    const fetchCreatorNames = async () => {
      if (viewMode === "review" && isInstructor) {
        const names: Record<string, string> = {};
        const uniqueCreators = Array.from(new Set(notes.map((note) => note.creator).filter(Boolean) as string[]));

        await Promise.all(
          uniqueCreators.map(async (creatorId) => {
            try {
              const name = await ApiService.fetchCreatorName(creatorId);
              names[creatorId] = name || "Unknown User";
            } catch (error) {
              console.error(`Error fetching creator name for ${creatorId}:`, error);
              names[creatorId] = "Unknown User";
            }
          })
        );

        setCreatorNames(names);
      } else {
        setCreatorNames({});
      }
    };

    fetchCreatorNames();
  }, [notes, viewMode, isInstructor]);

  const handleLoadText = (note: Note) => {
    clearDraftNote(); // Clear draft when clicking on an existing note
    onNoteSelect(note, false);
    setSelectedNoteId(note.id);
  };

  const handleDraftSelect = () => {
    setSelectedNoteId("draft"); // Set special ID to indicate draft is active
    if (onDraftSelect) {
      onDraftSelect();
    }
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
    setVisibleCount((prev) => prev + batch_size);
  };

  // Empty state: no notes at all
  if (notes.length === 0 && !isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-blue-50 rounded-full p-4 mb-4">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No notes yet</h3>
        <p className="text-sm text-gray-600 mb-4 max-w-xs">Click the "New Note" button below to create your first note!</p>
      </div>
    );
  }

  // Empty state: search returned no results
  if (notes.length === 0 && isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-gray-50 rounded-full p-4 mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
        <p className="text-sm text-gray-600 max-w-xs">Try adjusting your search or check the other tab</p>
      </div>
    );
  }

  return (
    <div id="notes-list" className="my-4 flex flex-col">
      {/* Draft note - shown at top when present */}
      {draftNote && (
        <div
          className={`p-2.5 mb-1.5 z-10 rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
            selectedNoteId === "draft"
              ? "bg-blue-50 border-2 border-blue-300 text-blue-900 shadow-md"
              : "bg-amber-50 border-2 border-dashed border-amber-300 text-amber-900 hover:bg-amber-100 hover:shadow-md"
          }`}
          onClick={handleDraftSelect}
        >
          <div className="flex flex-col space-y-1">
            <div className="flex flex-row items-start justify-between">
              <h3 className="text-sm font-semibold truncate flex-1 mr-2">
                {draftNote.title || "Untitled"}
              </h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-amber-200 text-amber-800 rounded">
                <FileEdit className="w-3 h-3" />
                Draft
              </span>
            </div>
            <p className="text-xs text-amber-700 truncate leading-relaxed">
              {draftNote.text ? extractTextFromHtml(draftNote.text) : "Start typing to save..."}
            </p>
          </div>
        </div>
      )}
      {notes.slice(0, visibleCount).map((note) => {
        let noteTextContent = extractTextFromHtml(note.text);
        if (noteTextContent === undefined || noteTextContent === null || noteTextContent === "" || noteTextContent === "undefined") {
          noteTextContent = "Empty note";
        }

        return (
          <div
            key={note.id}
            className={`p-2.5 mb-1.5 z-10 rounded-lg cursor-pointer transition-all duration-200 shadow-sm ${
              note.id === selectedNoteId
                ? "bg-blue-50 border border-blue-300 text-blue-900 shadow-md"
                : "bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 hover:shadow-md hover:border-gray-300"
            }`}
            onClick={() => handleLoadText(note)}
          >
            <div className="flex flex-col space-y-1">
              <div className="flex flex-row items-start justify-between">
                <h3 className="text-sm font-semibold truncate flex-1 mr-2">{note.title || "Untitled"}</h3>
                <span className="text-xs text-gray-500 flex-shrink-0">{handleGetTime(note.time)}</span>
              </div>
              {viewMode === "review" && isInstructor && note.creator && (
                <p className="text-xs text-gray-500 font-medium">By: {creatorNames[note.creator] || "Loading..."}</p>
              )}
              <p className="text-xs text-gray-600 truncate leading-relaxed">{noteTextContent}</p>
            </div>
          </div>
        );
      })}

      {visibleCount < notes.length && (
        <div className="mt-4 flex justify-center">
          <button onClick={moreNotes} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
            Load More Notes...
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteListView;
