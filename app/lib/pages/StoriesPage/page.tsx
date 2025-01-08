"use client";
import React, { useEffect, useState } from "react";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import EnhancedClickableNote from "../../components/stories_card"; // Updated import
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const StoriesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);

  const fetchStories = async (offset = 0, limit = 10) => {
    try {
      setIsLoading(true);
      const fetchedNotes = await ApiService.fetchPublishedNotes(offset, limit);

      // Debugging log to check fetched data
      console.log("Fetched Notes:", fetchedNotes);

      if (fetchedNotes.length === 0) {
        setHasMoreNotes(false);
        toast("No more stories to display.");
      } else {
        setNotes((prevNotes) => [...prevNotes, ...fetchedNotes]);
        setFilteredNotes((prevNotes) => [...prevNotes, ...fetchedNotes]);
      }
    } catch (error) {
      console.error("Error fetching stories:", error);
      toast.error("Failed to fetch stories. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories(skip);
  }, [skip]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredNotes(notes); // Reset to all notes
      return;
    }
    const lowerCaseQuery = query.toLowerCase();
    const results = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerCaseQuery) ||
        note.text.toLowerCase().includes(lowerCaseQuery) ||
        note.tags.some((tag) =>
          tag.label.toLowerCase().includes(lowerCaseQuery)
        )
    );
    setFilteredNotes(results);
  };

  const handleNext = () => {
    if (hasMoreNotes) {
      setSkip((prevSkip) => prevSkip + 10);
    }
  };

  const handlePrevious = () => {
    if (skip > 0) {
      setSkip((prevSkip) => Math.max(0, prevSkip - 10));
      setFilteredNotes(notes.slice(skip - 10, skip));
    }
  };

  return (
    <div className="flex flex-col w-screen h-[90vh] min-w-[600px] bg-gray-100 p-4">
      {/* Search Bar */}
      <div className="flex justify-center mb-4">
        <input
          type="text"
          placeholder="Search stories..."
          className="w-full max-w-md p-2 border rounded-lg shadow-sm"
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Stories Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-screen-lg">
          {isLoading
            ? [...Array(6)].map((_, index) => (
                <Skeleton
                  key={`skeleton-${index}`} // Add a unique key for each skeleton
                  className="w-full h-[400px] rounded-sm border border-gray-200"
                />
              ))
            : filteredNotes.length > 0
            ? filteredNotes.map((note, index) => (
                <EnhancedClickableNote
                  key={note.id || `note-${index}`} // Ensures unique keys even if note.id is missing
                  note={note}
                />
              ))
            : (
                <div key="no-stories" className="text-center col-span-full">
                  No stories found.
                </div>
              )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <button
          className="mx-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          onClick={handlePrevious}
          disabled={skip === 0}
        >
          Previous
        </button>
        <button
          className="mx-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          onClick={handleNext}
          disabled={!hasMoreNotes}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StoriesPage;
