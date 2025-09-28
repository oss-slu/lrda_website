"use client";
import React, { useEffect, useState, useRef } from "react";
import { Note } from "@/app/types";
import { User } from "../../models/user_class";
import ClickableNote from "../../components/click_note_card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes } from "../../utils/NotesContext";

// TODO: mapsidebar will be given notes from the map page
// and will not fetch notes itself
// map page will provide a callback to fetch more notes for infinite scrolling
// map page will provide lat/lon for fetching notes in notes context

export default function MapSidebar({ personalOrGlobal }: { personalOrGlobal: "personal" | "global" }) {
  const [displayedNotes, setDisplayedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const notesListRef = useRef<HTMLDivElement>(null);
  const noteRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { fetchPublishedNotes, fetchUserNotes, notes, isLoadingNotes } = useNotes();
  const user = User.getInstance();
  let userId: string | null = null;

  useEffect(() => {
    if (!isLoadingNotes) {
      const fetchUserId = async () => {
        userId = await user.getId();
      };
      fetchUserId();
      handleSetDisplayedNotes();
      setIsLoading(false);
    }
  }, [isLoadingNotes]);

  const fetchNotes = async () => {
    try {
      if (!userId) userId = await user.getId();

      if (userId && personalOrGlobal === "personal") {
        // Fetch personal notes if user is logged in
        await fetchUserNotes(userId);
      } else {
        await fetchPublishedNotes();
      }

      handleSetDisplayedNotes();

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    handleSetDisplayedNotes();
  }, [personalOrGlobal]);

  async function handleSetDisplayedNotes() {
    if (!userId) userId = await user.getId();
    // console.log("Toggling notes view. UserId:", userId, "Mode:", personalOrGlobal);

    // Toggle between personal and global notes
    if (userId && personalOrGlobal === "personal") {
      setDisplayedNotes(notes.filter((note) => note.creator === userId));
      console.log("personalDisplayedNotes", displayedNotes);
    } else {
      setDisplayedNotes(notes.filter((note) => note.published));
      console.log("globalDisplayedNotes", displayedNotes);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-white grid grid-cols-1 lg:grid-cols-2 gap-2 p-2" ref={notesListRef}>
      {isLoading
        ? [...Array(6)].map((_, index) => (
            <Skeleton key={index} className="w-64 h-[300px] rounded-sm flex flex-col border border-gray-200" />
          ))
        : displayedNotes.map((note, index) => (
            <div
              ref={(el) => {
                if (el) noteRefs.current[note.id] = el;
              }}
              className={`transition-transform duration-250 ease-in-out cursor-pointer max-h-[308px] max-w-[265px] hover:scale-[1.02] hover:shadow-lg hover:bg-gray-200`}
              key={index}
            >
              {/* Todo pull fetching out of this component */}
              <ClickableNote note={note} />
            </div>
          ))}

      <div className="col-span-full flex justify-center mt-4 min-h-10">
        <div ref={null} className="h-10 flex items-center justify-center w-full">
          {isLoading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" aria-label="Loading more" />
          ) : (
            <button onClick={fetchNotes} className="bg-primary text-white rounded-md px-4 py-2">
              Load More
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
