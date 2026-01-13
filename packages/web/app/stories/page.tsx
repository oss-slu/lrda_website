"use client";
import React, { useState, useMemo } from "react";
import { Note } from "@/app/types";
import EnhancedClickableNote from "../lib/components/stories_card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfinitePublishedNotes } from "../lib/hooks/queries/useNotes";
import { useCreatorName } from "../lib/hooks/queries/useUsers";

// Component to display user name with caching via TanStack Query
const UserOption = ({ uid }: { uid: string }) => {
  const { data: name = "Loading..." } = useCreatorName(uid);
  return <option value={uid}>{name}</option>;
};

const StoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Use TanStack Query infinite query for published notes
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfinitePublishedNotes(50);

  // Flatten pages into single array
  const allNotes = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  // Get unique creator IDs for user filter dropdown
  const uniqueCreatorIds = useMemo(() => {
    const ids = new Set(allNotes.map((note) => note.creator));
    return Array.from(ids).filter(Boolean);
  }, [allNotes]);

  // Filter notes by search query and selected user
  const filteredNotes = useMemo(() => {
    let results = allNotes.filter((note) => note.published === true && !note.isArchived);

    // Filter by selected user
    if (selectedUser) {
      results = results.filter((note) => note.creator === selectedUser);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(
        (note) =>
          note.title?.toLowerCase().includes(lowerQuery) ||
          note.text?.toLowerCase().includes(lowerQuery) ||
          note.tags?.some((tag) => tag?.label?.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort by date (most recent first)
    return results.sort((a, b) => {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return dateB - dateA;
    });
  }, [allNotes, searchQuery, selectedUser]);

  // Intersection observer for infinite scroll
  const loaderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Search Bar - Centered */}
      <div className="flex justify-center w-full mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-4xl">
          <input
            type="text"
            placeholder="Search stories..."
            className="w-full sm:flex-1 p-3 sm:p-4 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Dropdown for filtering by user */}
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full sm:w-auto sm:min-w-[200px] p-3 sm:p-4 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Users</option>
            {uniqueCreatorIds.map((uid) => (
              <UserOption key={uid} uid={uid} />
            ))}
          </select>
        </div>
      </div>

      {/* Stories Grid - Mobile Responsive */}
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 w-full">
          {isLoading ? (
            [...Array(6)].map((_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
                className="w-full h-[450px] sm:h-[500px] lg:h-[550px] rounded-xl border border-gray-200"
              />
            ))
          ) : filteredNotes.length > 0 ? (
            filteredNotes.map((note) => {
              const noteId = note.id || (note as Record<string, unknown>)["@id"];
              return <EnhancedClickableNote key={noteId as string} note={note} />;
            })
          ) : (
            <div className="text-center col-span-full py-8">
              <p className="text-gray-600 text-lg">No stories found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Infinite Scroll Loader */}
      {filteredNotes.length > 0 && (
        <div className="flex justify-center mt-6 mb-4">
          {hasNextPage ? (
            <div ref={loaderRef} className="h-10 flex items-center justify-center w-full">
              {isFetchingNextPage && (
                <div
                  className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"
                  aria-label="Loading more stories"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No more stories to load.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
