"use client";

import React, { forwardRef } from "react";
import { Note } from "@/app/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import NoteCard from "../note_card";
import { PANEL_WIDTH } from "../../constants/mapConstants";

interface Refs {
  [key: string]: HTMLElement | undefined;
}

interface MapNotesPanelProps {
  isPanelOpen: boolean;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
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
      isError,
      errorMessage,
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
        {/* Toggle Button - hidden on mobile when panel is open (panel has close button) */}
        <button
          onClick={onTogglePanel}
          aria-label={isPanelOpen ? "Close notes panel" : "Open notes panel"}
          className={`absolute top-1/2 z-20 -translate-y-1/2 bg-white rounded-full
                      shadow-md w-8 h-8 flex items-center justify-center 
                      transition-all duration-300 ease-in-out hover:bg-gray-100
                      ${isPanelOpen ? "hidden md:flex" : "flex"}`}
          style={{
            right: isPanelOpen ? PANEL_WIDTH : "1rem",
          }}
        >
          {isPanelOpen ? ">" : "<"}
        </button>

        {/* Notes Panel - full width on mobile, fixed width on desktop */}
        <div
          className={`absolute top-0 right-0 h-full overflow-y-auto bg-neutral-100
                      w-full md:w-[34rem] transition-transform duration-300 ease-in-out z-30
                      ${isPanelOpen ? "translate-x-0" : "translate-x-full"}`}
          ref={notesListRef}
        >
          {/* Mobile close button */}
          <div className="md:hidden flex justify-between items-center p-3 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h2 className="font-semibold text-lg">Notes</h2>
            <button onClick={onTogglePanel} aria-label="Close notes panel" className="p-2 rounded-full hover:bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 content-start">
            {isLoading ? (
              // Loading state
              [...Array(6)].map((_, index) => (
                <Skeleton key={index} className="w-64 h-[300px] rounded-sm flex flex-col border border-gray-200" />
              ))
            ) : isError ? (
              // Error state
              <div className="col-span-full flex flex-col items-center justify-center text-center p-4 py-20">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Failed to Load Notes</h3>
                <p className="text-gray-500 mt-2">{errorMessage || "Something went wrong while loading notes. Please try again later."}</p>
              </div>
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
