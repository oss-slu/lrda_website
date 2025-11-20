"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Note } from "@/app/types";
import ApiService from "../../utils/api_service";
import EnhancedClickableNote from "../../components/stories_card"; // Updated import
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useInfiniteNotes, NOTES_PAGE_SIZE } from "../../hooks/useInfiniteNotes";

// User name cache to avoid redundant API calls
const userNameCache = new Map<string, string>();

const StoriesPage = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [totalFetchedFromAPI, setTotalFetchedFromAPI] = useState(0); // Track total records fetched from API
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [users, setUsers] = useState<{ uid: string; name: string }[]>([]); // To store unique user IDs
  const [selectedUser, setSelectedUser] = useState<string>(""); // For dropdown selection
  
  // Infinite scrolling hook
  const infinite = useInfiniteNotes<Note>({
    items: filteredNotes,
    pageSize: NOTES_PAGE_SIZE,
  });

   // Fetch user names by resolving UIDs to names (with caching and lazy loading)
   const fetchUserNames = async (uids: string[], lazyLoad = false) => {
    try {
      const uniqueUsers = Array.from(new Set(uids));
      const userPromises = uniqueUsers.map(async (uid) => {
        // Check cache first
        if (userNameCache.has(uid)) {
          return { uid, name: userNameCache.get(uid)! };
        }
        
        try {
          const name = await ApiService.fetchCreatorName(uid); // Fetch name from Firestore or RERUM
          // Cache the result
          userNameCache.set(uid, name);
          return { uid, name };
        } catch (error) {
          console.error(`Error fetching name for UID ${uid}:`, error);
          const fallbackName = "Unknown User";
          userNameCache.set(uid, fallbackName); // Cache fallback too
          return { uid, name: fallbackName }; // Fallback for failed lookups
        }
      });
      
      // If lazy loading, only fetch for visible notes (first 50 UIDs)
      if (lazyLoad && uniqueUsers.length > 50) {
        const visibleUids = uniqueUsers.slice(0, 50);
        const remainingUids = uniqueUsers.slice(50);
        
        // Fetch visible ones immediately
        const visiblePromises = visibleUids.map(async (uid) => {
          if (userNameCache.has(uid)) {
            return { uid, name: userNameCache.get(uid)! };
          }
          try {
            const name = await ApiService.fetchCreatorName(uid);
            userNameCache.set(uid, name);
            return { uid, name };
          } catch (error) {
            const fallbackName = "Unknown User";
            userNameCache.set(uid, fallbackName);
            return { uid, name: fallbackName };
          }
        });
        
        const visibleUsers = await Promise.all(visiblePromises);
        
        // Fetch remaining ones in background (don't await)
        Promise.all(remainingUids.map(async (uid) => {
          if (!userNameCache.has(uid)) {
            try {
              const name = await ApiService.fetchCreatorName(uid);
              userNameCache.set(uid, name);
            } catch {
              userNameCache.set(uid, "Unknown User");
            }
          }
        })).catch(() => {}); // Silently handle background errors
        
        return visibleUsers;
      }
      
      return Promise.all(userPromises); // Resolve all user name fetches
    } catch (error) {
      console.error("Error fetching user names:", error);
      return [];
    }
  };

  const fetchStories = useCallback(async (limit = 150, skipCount = 0, append = false) => {
    const startTime = Date.now();
    console.log(`[StoriesPage] fetchStories called - limit: ${limit}, skip: ${skipCount}, append: ${append}`);
    
    try {
      if (append) {
        setIsLoadingMore(true);
        console.log(`[StoriesPage] Starting to load more notes from skip=${skipCount}`);
      } else {
        setIsLoading(true);
        setSkip(0);
        setTotalFetchedFromAPI(0); // Reset API fetch counter
        setHasMoreNotes(true);
        console.log(`[StoriesPage] Starting initial fetch with limit=${limit}`);
        
        // Check cache first (only for initial load)
        const cacheKey = `stories_${limit}_${skipCount}`;
        if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const cachedData = JSON.parse(cached) as { notes: Note[]; timestamp: number };
              const cacheAge = Date.now() - cachedData.timestamp;
              // Use cache if less than 5 minutes old
              if (cacheAge < 5 * 60 * 1000) {
                console.log(`[StoriesPage] Using cached data (age: ${Math.round(cacheAge / 1000)}s)`);
                const cachedNotes = cachedData.notes;
                let publishedNotes = cachedNotes.filter((note: Note) => note.published === true && !note.isArchived);
                
                // Sort cached notes by date as well
                publishedNotes = publishedNotes.sort((a, b) => {
                  const dateA = new Date(a.time).getTime();
                  const dateB = new Date(b.time).getTime();
                  return dateB - dateA; // Most recent first
                });
                
                const uids = Array.from(new Set(publishedNotes.map((note: Note) => note.creator)));
                const userList = await fetchUserNames(uids, true); // Lazy load from cache
                
                setUsers((prevUsers) => {
                  const mergedUsers = [...prevUsers, ...userList];
                  return mergedUsers
                    .filter((user) => user && user.uid)
                    .filter((user, index, self) => index === self.findIndex((u) => u.uid === user.uid));
                });
                
                setNotes(publishedNotes);
                setFilteredNotes(publishedNotes);
                // For cached data, estimate the skip value (approximate)
                setSkip(publishedNotes.length);
                setTotalFetchedFromAPI(publishedNotes.length);
                setIsLoading(false);
                console.log(`[StoriesPage] Loaded from cache in ${Date.now() - startTime}ms, set skip to ${publishedNotes.length}`);
                return;
              } else {
                console.log(`[StoriesPage] Cache expired (age: ${Math.round(cacheAge / 1000)}s), fetching from API`);
              }
            }
          } catch (e) {
            // Cache read failed, continue with API call
            console.log(`[StoriesPage] Cache read failed, fetching from API`);
          }
        }
      }
      
      const apiStartTime = Date.now();
      const fetchedNotes = await ApiService.fetchPublishedNotes(limit, skipCount);
      const apiEndTime = Date.now();
      console.log(`[StoriesPage] API call completed in ${apiEndTime - apiStartTime}ms, fetched ${fetchedNotes.length} notes (skip=${skipCount})`);
      
      // Cache the result (only for initial load)
      if (!append && typeof window !== 'undefined') {
        try {
          const cacheKey = `stories_${limit}_${skipCount}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            notes: fetchedNotes,
            timestamp: Date.now()
          }));
          console.log(`[StoriesPage] Cached ${fetchedNotes.length} notes`);
        } catch (e) {
          // Cache write failed, continue
          console.log(`[StoriesPage] Cache write failed:`, e);
        }
      }
      
      // Filter to ensure only published and non-archived notes are shown (client-side safety check)
      const filterStartTime = Date.now();
      let publishedNotes = fetchedNotes.filter((note) => note.published === true && !note.isArchived);
      
      // Update skip based on the number of notes fetched from API (not filtered count)
      // This ensures we skip the correct number in the next API call
      const totalFetched = fetchedNotes.length;
      
      // Sort notes by date (most recent first) to ensure consistent ordering
      publishedNotes = publishedNotes.sort((a, b) => {
        const dateA = new Date(a.time).getTime();
        const dateB = new Date(b.time).getTime();
        return dateB - dateA; // Most recent first
      });
      
      const filterEndTime = Date.now();
      console.log(`[StoriesPage] Filtering and sorting completed in ${filterEndTime - filterStartTime}ms, ${publishedNotes.length} published notes after filter`);

      if (publishedNotes.length === 0) {
        // No notes returned - we've reached the end
        setHasMoreNotes(false);
        if (append) {
          toast("No more stories to display.");
          console.log(`[StoriesPage] No notes returned (fetched ${totalFetched} from API), reached end, setting hasMoreNotes to false`);
        } else {
          toast("No stories to display.");
          console.log(`[StoriesPage] No notes found on initial load`);
        }
      } else {
        // Got some notes - check if we've reached the end
        if (publishedNotes.length < limit) {
          // Got fewer than requested - likely at the end, but keep hasMoreNotes true
          // to allow one more fetch to confirm (it will return 0 if we're done)
          console.log(`[StoriesPage] Got ${publishedNotes.length} notes (less than limit ${limit}), keeping hasMoreNotes true for next fetch`);
        } else {
          // Got full limit, definitely more available
          console.log(`[StoriesPage] Got full limit (${limit} notes), more available`);
        }

        const uidsStartTime = Date.now();
        const uids = publishedNotes.map((note) => note.creator); // Collect UIDs from notes
        const uniqueUids = Array.from(new Set(uids));
        console.log(`[StoriesPage] Collected ${uniqueUids.length} unique UIDs from ${uids.length} notes`);
        
        const userNamesStartTime = Date.now();
        // Use lazy loading for initial fetch, full fetch for appends (smaller batches)
        const userList = await fetchUserNames(uniqueUids, !append); // Lazy load on initial fetch
        const userNamesEndTime = Date.now();
        console.log(`[StoriesPage] User names fetched in ${userNamesEndTime - userNamesStartTime}ms, got ${userList.length} users (lazyLoad: ${!append})`);

        const usersUpdateStartTime = Date.now();
        setUsers((prevUsers) => {
          const mergedUsers = [...prevUsers, ...userList];
          // Remove duplicates (if user IDs are already in the state) and filter out invalid entries
          return mergedUsers
            .filter((user) => user && user.uid) // Remove invalid entries
            .filter(
              (user, index, self) =>
                index === self.findIndex((u) => u.uid === user.uid)
            );
        });
        const usersUpdateEndTime = Date.now();
        console.log(`[StoriesPage] Users state updated in ${usersUpdateEndTime - usersUpdateStartTime}ms`);

        const notesUpdateStartTime = Date.now();
        if (append) {
          // Append new notes to existing ones, deduplicate by ID, and re-sort to maintain date order
          setNotes((prevNotes) => {
            // Create a Map to track existing note IDs for fast lookup
            // Handle both id and @id fields
            const existingIds = new Set(prevNotes.map(note => note.id || (note as any)["@id"]));
            
            // Filter out notes that already exist (check both id and @id)
            const uniqueNewNotes = publishedNotes.filter(note => {
              const noteId = note.id || (note as any)["@id"];
              return !existingIds.has(noteId);
            });
            
            if (uniqueNewNotes.length === 0) {
              console.log(`[StoriesPage] All ${publishedNotes.length} notes already exist, skipping append but updating skip by ${totalFetched}`);
              // Even if all notes are duplicates, we still need to update skip
              // to avoid fetching the same records again
              setTotalFetchedFromAPI((prev) => {
                const newTotal = prev + totalFetched;
                setSkip(newTotal);
                console.log(`[StoriesPage] No new notes, but updating skip from ${prev} to ${newTotal} (fetched ${totalFetched} from API)`);
                return newTotal;
              });
              return prevNotes;
            }
            
            const newNotes = [...prevNotes, ...uniqueNewNotes];
            // Re-sort all notes by date to ensure proper ordering (new notes might be more recent)
            const sortedNotes = newNotes.sort((a, b) => {
              const dateA = new Date(a.time).getTime();
              const dateB = new Date(b.time).getTime();
              return dateB - dateA; // Most recent first
            });
            
            // Update skip based on total fetched from API, not displayed count
            // This ensures we skip the correct number in the next API call
            setTotalFetchedFromAPI((prev) => {
              const newTotal = prev + totalFetched;
              setSkip(newTotal);
              console.log(`[StoriesPage] Appending ${uniqueNewNotes.length} unique notes (${publishedNotes.length - uniqueNewNotes.length} duplicates skipped), total displayed: ${sortedNotes.length}, total fetched from API: ${newTotal}, skip set to ${newTotal}`);
              return newTotal;
            });
            return sortedNotes;
          });
          setFilteredNotes((prevFiltered) => {
            // Create a Map to track existing note IDs for fast lookup
            // Handle both id and @id fields
            const existingIds = new Set(prevFiltered.map(note => note.id || (note as any)["@id"]));
            
            // Filter out notes that already exist (check both id and @id)
            const uniqueNewNotes = publishedNotes.filter(note => {
              const noteId = note.id || (note as any)["@id"];
              return !existingIds.has(noteId);
            });
            
            if (uniqueNewNotes.length === 0) {
              return prevFiltered;
            }
            
            const newFiltered = [...prevFiltered, ...uniqueNewNotes];
            // Re-sort filtered notes as well
            const sortedFiltered = newFiltered.sort((a, b) => {
              const dateA = new Date(a.time).getTime();
              const dateB = new Date(b.time).getTime();
              return dateB - dateA; // Most recent first
            });
            console.log(`[StoriesPage] Appending to filtered notes, total will be ${sortedFiltered.length} (sorted by date)`);
            return sortedFiltered;
          });
        } else {
          // Replace notes (initial load or reset) - already sorted above
          // Deduplicate by ID before setting (safety check)
          // Handle both id and @id fields
          const uniqueNotes = publishedNotes.filter((note, index, self) => {
            const noteId = note.id || (note as any)["@id"];
            return index === self.findIndex(n => {
              const nId = n.id || (n as any)["@id"];
              return nId === noteId;
            });
          });
          
          if (uniqueNotes.length !== publishedNotes.length) {
            console.log(`[StoriesPage] Removed ${publishedNotes.length - uniqueNotes.length} duplicate notes on initial load`);
          }
          
          console.log(`[StoriesPage] Replacing notes with ${uniqueNotes.length} unique notes (sorted by date)`);
          setNotes(uniqueNotes);
          setFilteredNotes(uniqueNotes);
          // Set skip to total fetched from API (not displayed count)
          // This ensures pagination works correctly with the API's skip parameter
          setSkip(totalFetched);
          setTotalFetchedFromAPI(totalFetched);
          console.log(`[StoriesPage] Set skip to ${totalFetched} (fetched ${totalFetched} notes from API, ${uniqueNotes.length} displayed after filter and deduplication)`);
        }
        const notesUpdateEndTime = Date.now();
        console.log(`[StoriesPage] Notes state updated in ${notesUpdateEndTime - notesUpdateStartTime}ms`);
        
        const totalTime = Date.now() - startTime;
        console.log(`[StoriesPage] fetchStories completed in ${totalTime}ms total`);
      }
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`[StoriesPage] Error fetching notes after ${errorTime}ms:`, error);
      toast.error("Failed to fetch notes. Please try again.");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Load more notes when user scrolls through all visible items
  useEffect(() => {
    // Check if we've scrolled through all current notes and need to fetch more
    console.log(`[StoriesPage] Pagination check - visibleItems: ${infinite.visibleItems.length}, filteredNotes: ${filteredNotes.length}, hasMore: ${infinite.hasMore}, isLoading: ${isLoading}, isLoadingMore: ${isLoadingMore}, hasMoreNotes: ${hasMoreNotes}, skip: ${skip}`);
    
    if (
      !isLoading &&
      !isLoadingMore &&
      hasMoreNotes &&
      infinite.visibleItems.length > 0 &&
      infinite.visibleItems.length >= filteredNotes.length &&
      !infinite.hasMore
    ) {
      // User has scrolled through all current notes, fetch next batch
      console.log(`[StoriesPage] Triggering fetchStories with skip=${skip}`);
      fetchStories(150, skip, true);
    }
  }, [infinite.visibleItems.length, infinite.hasMore, filteredNotes.length, skip, isLoading, isLoadingMore, hasMoreNotes, fetchStories]);

  const fetchFilteredNotesByUser = async (creatorId: string) => {
    try {
      setIsLoading(true);
      const userNotes = await ApiService.getPagedQueryWithParams(150, 0, creatorId); // Increased limit to 150
      // Filter to ensure only published and non-archived notes are shown (client-side safety check)
      let publishedUserNotes = userNotes.filter((note) => note.published === true && !note.isArchived);
      
      // Sort by date (most recent first)
      publishedUserNotes = publishedUserNotes.sort((a, b) => {
        const dateA = new Date(a.time).getTime();
        const dateB = new Date(b.time).getTime();
        return dateB - dateA; // Most recent first
      });
      
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
        !note.isArchived &&
        ((note.title?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (note.text?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        (note.tags?.some((tag) =>
          tag?.label?.toLowerCase().includes(lowerCaseQuery) ?? false
        ) ?? false))
    );
    setFilteredNotes(results);
  };

  const handleUserFilter = (userId: string) => {
    setSelectedUser(userId);
    if (userId === "") {
      setFilteredNotes(notes); // Show all notes if no user is selected
    } else {
      const results = notes.filter(
        (note) => note.creator === userId && note.published && !note.isArchived
      );
      setFilteredNotes(results);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-100 p-2 sm:p-4">
      {/* Search Bar - Centered */}
      <div className="flex justify-center w-full mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-4xl">
          <input
            type="text"
            placeholder="Search stories..."
            className="w-full sm:flex-1 p-3 sm:p-4 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full sm:w-auto sm:min-w-[200px] p-3 sm:p-4 border border-gray-300 rounded-lg shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option key="all-users" value="">All Users</option>
            {users
              .filter((user) => user && user.uid) // Ensure valid users only
              .map((user, index) => (
                <option key={`user-${user.uid}-${index}`} value={user.uid}>
                  {user.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Stories Grid - Mobile Responsive */}
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10 w-full">
          {isLoading
            ? [...Array(6)].map((_, index) => (
                <Skeleton
                  key={`skeleton-${index}`}
                  className="w-full h-[450px] sm:h-[500px] lg:h-[550px] rounded-xl border border-gray-200"
                />
              ))
            : filteredNotes.length > 0
            ? infinite.visibleItems.map((note, index) => {
                // Use note.id or note["@id"] as primary key (should always be unique)
                // Notes from API may have @id instead of id
                const noteId = note.id || (note as any)["@id"];
                let uniqueKey: string;
                
                if (noteId && typeof noteId === 'string' && noteId.trim() !== '') {
                  // Use the note ID directly - it should be unique
                  uniqueKey = noteId;
                } else {
                  // Fallback: create a unique key using multiple fields + index
                  // Include index FIRST to ensure uniqueness even if other fields match
                  const timeStr = note.time ? new Date(note.time).toISOString() : `no-time`;
                  const latStr = note.latitude || `no-lat`;
                  const lngStr = note.longitude || `no-lng`;
                  const titleStr = (note.title || 'no-title').substring(0, 20).replace(/\s+/g, '-');
                  // Always include index FIRST to guarantee uniqueness
                  uniqueKey = `note-${index}-${note.creator || 'no-creator'}-${timeStr}-${latStr}-${lngStr}-${titleStr}`;
                  
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(`[StoriesPage] Note missing id, using fallback key:`, {
                      title: note.title,
                      creator: note.creator,
                      time: note.time,
                      index: index,
                      noteId: noteId,
                      hasId: !!note.id,
                      hasAtId: !!(note as any)["@id"],
                      fallbackKey: uniqueKey
                    });
                  }
                }
                
                return (
                  <EnhancedClickableNote
                    key={uniqueKey}
                    note={note}
                  />
                );
              })
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
          {(infinite.hasMore || (hasMoreNotes && !isLoadingMore)) ? (
            <div ref={infinite.loaderRef as any} className="h-10 flex items-center justify-center w-full">
              {(infinite.isLoading || isLoadingMore) && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary" aria-label="Loading more stories" />
              )}
            </div>
          ) : !hasMoreNotes ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No more stories to load.</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
