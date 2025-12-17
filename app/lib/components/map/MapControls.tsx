"use client";

import React, { forwardRef } from "react";
import { UserIcon, Plus, Minus, Users } from "lucide-react";
import SearchBarMap from "../search_bar_map";
import { Note } from "@/app/types";

interface MapControlsProps {
  // Search
  onSearch: (address: string, lat?: number, lng?: number, isNoteClick?: boolean) => void;
  onNotesSearch: (searchText: string) => void;
  isLoaded: boolean;
  filteredNotes: Note[];

  // View toggle
  isLoggedIn: boolean;
  isGlobalView: boolean;
  onToggleView: () => void;

  // Zoom
  mapZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;

  // Location
  onLocate: () => void;

  // Panel state (for positioning)
  isPanelOpen: boolean;
}

const MapControls = forwardRef<HTMLDivElement, MapControlsProps>(
  (
    {
      onSearch,
      onNotesSearch,
      isLoaded,
      filteredNotes,
      isLoggedIn,
      isGlobalView,
      onToggleView,
      mapZoom,
      onZoomIn,
      onZoomOut,
      onLocate,
      isPanelOpen,
    },
    searchBarRef
  ) => {
    return (
      <div className="absolute flex flex-row mt-4 w-full h-10 justify-between z-40 pointer-events-none">
        {/* Left side - Search and view toggle */}
        <div className="flex flex-row w-[30vw] left-0 z-40 m-5 align-center items-center pointer-events-auto">
          <div className="min-w-[80px] mr-3" ref={searchBarRef}>
            <SearchBarMap onSearch={onSearch} onNotesSearch={onNotesSearch} isLoaded={isLoaded} filteredNotes={filteredNotes} />
          </div>
          {isLoggedIn ? (
            <button
              aria-label={isGlobalView ? "Show personal posts" : "Show global posts"}
              onClick={onToggleView}
              type="button"
              className={`rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors p-2 md:p-3 xl:p-3.5 mx-2 ${
                isGlobalView ? "text-blue-600" : "text-green-600"
              }`}
            >
              {isGlobalView ? (
                <Users className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
              ) : (
                <UserIcon className="w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
              )}
            </button>
          ) : null}
        </div>

        {/* Right side - Zoom and location */}
        <div
          className={`flex flex-row items-center gap-2 transition-all duration-300 ease-in-out mr-4 pointer-events-auto
                      ${isPanelOpen ? "mr-[35rem]" : "mr-4"}`}
        >
          {/* Zoom Out Button */}
          <button
            aria-label="Zoom out"
            className="rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 md:p-3 xl:p-3.5"
            onClick={onZoomOut}
            type="button"
          >
            <Minus className="text-gray-700 w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
          </button>
          {/* Zoom In Button */}
          <button
            aria-label="Zoom in"
            className="rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 md:p-3 xl:p-3.5"
            onClick={onZoomIn}
            type="button"
          >
            <Plus className="text-gray-700 w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6" />
          </button>
          {/* Locate Button */}
          <button
            aria-label="Find my location"
            className="rounded-full bg-white shadow hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ml-4 p-2 md:p-3 xl:p-3 flex items-center justify-center"
            onClick={onLocate}
            type="button"
          >
            <svg
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 md:w-5 md:h-5 xl:w-7 xl:h-7 text-gray-600"
            >
              <path d="M11.087 20.914c-.353 0-1.219-.146-1.668-1.496L8.21 15.791l-3.628-1.209c-1.244-.415-1.469-1.172-1.493-1.587s.114-1.193 1.302-1.747l11.375-5.309c1.031-.479 1.922-.309 2.348.362.224.351.396.97-.053 1.933l-5.309 11.375c-.529 1.135-1.272 1.305-1.665 1.305zm-5.39-8.068 4.094 1.363 1.365 4.093 4.775-10.233-10.234 4.777z"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

MapControls.displayName = "MapControls";

export default MapControls;
