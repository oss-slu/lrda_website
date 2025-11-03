"use client";
import React, { useEffect, useState } from "react";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import EnhancedClickableNote from "../../components/stories_card"; // Updated import
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useInfiniteNotes, NOTES_PAGE_SIZE } from "../../hooks/useInfiniteNotes";

const StoriesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<{ uid: string; name: string }[]>([]); // To store unique user IDs
  const [selectedUser, setSelectedUser] = useState<string>(""); // For dropdown selection
  
  // Infinite scrolling hook
  const infinite = useInfiniteNotes<Note>({
    items: filteredNotes,
    pageSize: NOTES_PAGE_SIZE,
  });


   // Fetch user names by resolving UIDs to names
   const fetchUserNames = async (uids: string[]) => {
    try {
      const uniqueUsers = new Set(uids);
      const userPromises = Array.from(uniqueUsers).map(async (uid) => {
        try {
          const name = await ApiService.fetchCreatorName(uid); // Fetch name from Firestore or RERUM
          return { uid, name };
        } catch (error) {
          console.error(`Error fetching name for UID ${uid}:`, error);
          return { uid, name: "Unknown User" }; // Fallback for failed lookups
        }
      });
      return Promise.all(userPromises); // Resolve all user name fetches
    } catch (error) {
      console.error("Error fetching user names:", error);
      return [];
    }
  };

  const fetchStories = async (limit = 150) => { // Increased limit to 150 for better performance
    try {
      setIsLoading(true);
      const fetchedNotes = await ApiService.fetchPublishedNotes(limit, 0);
      
      // Filter to ensure only published notes are shown (client-side safety check)
      const publishedNotes = fetchedNotes.filter((note) => note.published === true);

      // Debugging log to check fetched data
      console.log("Fetched Notes:", publishedNotes);

      if (publishedNotes.length === 0) {
        toast("No more stories to display.");
      } else {
        const uids = publishedNotes.map((note) => note.creator); // Collect UIDs from notes
        const userList = await fetchUserNames(uids); // Resolve UIDs to names

        setUsers((prevUsers) => {
          const mergedUsers = [...prevUsers, ...userList];
          // Remove duplicates (if user IDs are already in the state)
          return mergedUsers.filter(
            (user, index, self) =>
              index === self.findIndex((u) => u.uid === user.uid)
          );
        });

        setNotes(publishedNotes);
        setFilteredNotes(publishedNotes);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to fetch notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredNotesByUser = async (creatorId: string) => {
    try {
      setIsLoading(true);
      const userNotes = await ApiService.getPagedQueryWithParams(150, 0, creatorId); // Increased limit to 150
      // Filter to ensure only published notes are shown (client-side safety check)
      const publishedUserNotes = userNotes.filter((note) => note.published === true);
      setFilteredNotes(publishedUserNotes); // Display only published notes for the selected user
    } catch (error) {
      console.error(`Error fetching notes for user ${creatorId}:`, error);
      toast.error("Failed to fetch user notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };





  useEffect(() => {
    fetchStories();
  }, []);

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

  const handleUserFilter = (userId: string) => {
    setSelectedUser(userId);
    if (userId === "") {
      setFilteredNotes(notes); // Show all notes if no user is selected
    } else {
      const results = notes.filter(
        (note) => note.creator === userId && note.published
      );
      setFilteredNotes(results);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Search Bar - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 w-full">
        <input
          type="text"
          placeholder="Search stories..."
          className="w-full sm:max-w-md p-2 sm:p-3 border rounded-lg shadow-sm text-sm sm:text-base"
          onChange={(e) => handleSearch(e.target.value)}
        />
        {/* Dropdown for filtering by user */}
        <select
          value={selectedUser}
          onChange={async (e) => {
            const userId = e.target.value;
            setSelectedUser(userId); // Update the selected user in state
            if (userId === "") {
              setFilteredNotes(notes); // Show all notes if no user is selected
            } else {
              await fetchFilteredNotesByUser(userId); // Dynamically fetch and filter notes
            }
          }}
          className="w-full sm:w-auto p-2 sm:p-3 border rounded-lg shadow-sm text-sm sm:text-base"
        >
          <option value="">All Users</option>
          {users.map((user) => (
            <option key={user.uid} value={user.uid}>
              {user.name} {/* Display user names */}
            </option>
          ))}
        </select>
      </div>

      {/* Stories Grid - Mobile Responsive */}
      <div className="flex justify-center w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full max-w-7xl">
          {isLoading
            ? [...Array(6)].map((_, index) => (
                <Skeleton
                  key={`skeleton-${index}`}
                  className="w-full h-[300px] sm:h-[350px] lg:h-[400px] rounded-lg border border-gray-200"
                />
              ))
            : filteredNotes.length > 0
            ? infinite.visibleItems.map((note, index) => (
                <EnhancedClickableNote
                  key={note.id || `note-${index}`}
                  note={note}
                />
              ))
            : (
                <div key="no-stories" className="text-center col-span-full py-8">
                  <p className="text-gray-600 text-lg">No stories found.</p>
                </div>
              )}
        </div>
      </div>

      {/* Infinite Scroll Loader */}
      {filteredNotes.length > 0 && (
        <div className="flex justify-center mt-6 mb-4">
          {infinite.hasMore ? (
            <div ref={infinite.loaderRef as any} className="h-10 flex items-center justify-center w-full">
              {infinite.isLoading && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" aria-label="Loading more stories" />
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
