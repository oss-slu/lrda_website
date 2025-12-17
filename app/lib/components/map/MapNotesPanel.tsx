"use client";

import React, { forwardRef } from "react";
import { Note } from "@/app/types";
import { Skeleton } from "@/components/ui/skeleton";
import NoteCard from "../note_card";

interface Refs {
  [key: string]: HTMLElement | undefined;
}

interface MapNotesPanelProps {
  isPanelOpen: boolean;
  isLoading: boolean;
  visibleItems: Note[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loaderRef: React.RefCallback<HTMLDivElement>;
  activeNoteId: string | null;
  noteRefs: React.MutableRefObject<Refs>;
  onNoteHover: (noteId: string | null) => void;
  onNoteClick: (note: Note) => void;
  onTogglePanel: () => void;
}

const MapNotesPanel = forwardRef<HTMLDivElement, MapNotesPanelProps>(
  (
    {
      isPanelOpen,
      isLoading,
      visibleItems,
      hasMore,
      isLoadingMore,
      loaderRef,
      activeNoteId,
      noteRefs,
      onNoteHover,
      onNoteClick,
      onTogglePanel,
    },
    notesListRef
  ) => {
    return (
      <>
        {/* Toggle Button */}
        <button
          onClick={onTogglePanel}
          className={`absolute top-1/2 z-20 -translate-y-1/2 bg-white rounded-full
                      shadow-md w-8 h-8 flex items-center justify-center 
                      transition-all duration-300 ease-in-out hover:bg-gray-100`}
          style={{
            right: isPanelOpen ? "34rem" : "1rem",
          }}
        >
          {isPanelOpen ? ">" : "<"}
        </button>

        {/* Notes Panel */}
        <div
          className={`absolute top-0 right-0 h-full overflow-y-auto bg-neutral-100
                      w-[34rem] transition-transform duration-300 ease-in-out z-30
                      ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
          ref={notesListRef}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 content-start">
            {isLoading ? (
              // Loading state
              [...Array(6)].map((_, index) => (
                <Skeleton key={index} className="w-64 h-[300px] rounded-sm flex flex-col border border-gray-200" />
              ))
            ) : visibleItems.length > 0 ? (
              // Notes found
              visibleItems.map((note) => (
                <div
                  key={note.id}
                  ref={(el) => {
                    if (el) noteRefs.current[note.id] = el;
                  }}
                  className={`transition-transform duration-300 ease-in-out cursor-pointer max-h-[308px] max-w-[265px] ${
                    note.id === activeNoteId ? "active-note" : "hover:bg-gray-100"
                  }`}
                  onMouseEnter={() => onNoteHover(note.id)}
                  onMouseLeave={() => onNoteHover(null)}
                  onClick={() => onNoteClick(note)}
                >
                  <NoteCard note={note} />
                </div>
              ))
            ) : (
              // Empty state
              <div className="col-span-full flex flex-col items-center justify-center text-center p-4 py-20">
                <h3 className="text-xl font-semibold text-gray-700 mt-4">No Results Found</h3>
                <p className="text-gray-500 mt-2">Sorry, there are no notes in this area. Try zooming out or moving the map.</p>
              </div>
            )}

            {/* Infinite scroll loader */}
            <div className="col-span-full flex justify-center mt-4 min-h-10">
              {hasMore ? (
                <div ref={loaderRef} className="h-10 flex items-center justify-center w-full">
                  {isLoadingMore && (
                    <div
                      className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"
                      aria-label="Loading more"
                    />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </>
    );
  }
);

MapNotesPanel.displayName = "MapNotesPanel";

export default MapNotesPanel;
