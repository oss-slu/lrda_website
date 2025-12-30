"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchBarNote from "./search_bar_note";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import { useNotesStore } from "../stores/notesStore";
import { useAuthStore } from "../stores/authStore";
import { useShallow } from "zustand/react/shallow";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const { notes, fetchNotes, viewMode, draftNote, setDraftNote, setSelectedNoteId } = useNotesStore(
    useShallow((state) => ({
      notes: state.notes,
      fetchNotes: state.fetchNotes,
      viewMode: state.viewMode,
      draftNote: state.draftNote,
      setDraftNote: state.setDraftNote,
      setSelectedNoteId: state.setSelectedNoteId,
    }))
  );
  const { user } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );
  const [showPublished, setShowPublished] = useState(false); // Default to Unpublished tab
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  // Teacher-student view mode (from december-sprint) - now from store
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [localNotes, setLocalNotes] = useState<Note[]>([]); // Local notes for review mode
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingPausedRef = useRef<boolean>(false);

  console.log("Sidebar render");
  const handleAddNote = async () => {
    const userId = user?.uid;
    if (userId) {
      // Create a local-only draft note (not saved to DB yet)
      const newDraftNote: newNote = {
        title: "",
        text: "",
        time: new Date(),
        media: [],
        audio: [],
        creator: userId,
        latitude: "",
        longitude: "",
        published: false,
        tags: [],
        isArchived: false,
      };

      // Add draft to store so it appears in sidebar immediately
      setDraftNote(newDraftNote);

      // Set selectedNoteId to "draft" to clear any existing active note and mark draft as active
      setSelectedNoteId("draft");

      // Open for editing immediately; will save when user types
      onNoteSelect(newDraftNote, true);
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };

  // Initialize instructor role
  useEffect(() => {
    const initRoleFlags = async () => {
      if (!user?.uid) {
        setIsInstructor(false);
        return;
      }

      const roles = user.roles;
      const userId = user.uid;

      // Fetch userData to check isInstructor flag
      let userData = null;
      try {
        userData = await ApiService.fetchUserData(userId);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      // Check if user is an instructor (has administrator role OR isInstructor flag in userData)
      // Allow toggle for administrators even if isInstructor flag isn't set
      const isInstr = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructor(isInstr);
    };
    initRoleFlags();
  }, [user]);

  // Fetch notes based on view mode - memoized to prevent unnecessary re-renders
  const fetchNotesForView = useCallback(async () => {
    try {
      const userId = user?.uid;
      if (!userId) {
        console.error("User not logged in");
        return;
      }

      if (viewMode === "my") {
        // Use notesStore for "My Notes" mode
        await fetchNotes(userId);
      } else if (viewMode === "review" && isInstructor) {
        // Instructor reviewing student notes
        const instructorData = await ApiService.fetchUserData(userId);
        if (!instructorData || !instructorData.isInstructor) {
          console.warn("User is not an instructor");
          setLocalNotes([]);
          return;
        }

        const studentUids = instructorData.students || [];
        console.log("📝 Student UIDs from instructor data:", studentUids);

        if (studentUids.length === 0) {
          console.warn("No students found for instructor");
          setLocalNotes([]);
          return;
        }

        // Fetch all notes from students
        const allNotes = await ApiService.fetchNotesByStudents(studentUids);
        console.log("📋 All student notes fetched:", allNotes.length);
        const converted = DataConversion.convertMediaTypes(allNotes).reverse();
        const unarchived = converted.filter((n) => !n.isArchived);
        console.log("📋 Total unarchived notes:", unarchived.length);

        setLocalNotes(unarchived);
        // Reset to showing "Unreviewed" (awaiting approval) when fetching fresh
        setShowPublished(false);
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }, [viewMode, isInstructor, fetchNotes]);

  // Initial fetch and setup polling
  useEffect(() => {
    fetchNotesForView();
  }, [fetchNotesForView]);

  // Setup polling for automatic note refresh
  useEffect(() => {
    // Polling interval: 15 seconds
    const POLLING_INTERVAL = 15000;

    // Handle page visibility to pause/resume polling
    const handleVisibilityChange = () => {
      isPollingPausedRef.current = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Setup polling interval
    const startPolling = () => {
      // Clear any existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        // Only poll if page is visible
        if (!isPollingPausedRef.current) {
          fetchNotesForView();
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [fetchNotesForView]);

  // Derive filteredNotes from source data - no manual sync needed
  const filteredNotes = useMemo(() => {
    // If searching, use search results
    if (isSearching && searchResults !== null) {
      return searchResults;
    }

    const notesToFilter = viewMode === "review" ? localNotes : notes;

    if (viewMode === "review") {
      // Review mode: Unreviewed vs Reviewed
      if (showPublished) {
        // Reviewed
        return notesToFilter.filter((n) => !n.isArchived && !!n.published);
      } else {
        // Unreviewed
        return notesToFilter.filter((n) => !n.isArchived && !!n.approvalRequested && !n.published);
      }
    } else {
      // My Notes mode: Published vs Unpublished
      return notesToFilter.filter((note) => !note.isArchived && (showPublished ? note.published : !note.published));
    }
  }, [notes, localNotes, showPublished, viewMode, isSearching, searchResults]);

  // Update selected note when it changes in localNotes (for instructor review mode)
  useEffect(() => {
    if (viewMode === "review" && localNotes.length > 0) {
      // Get the currently selected note ID from the store
      const selectedNoteId = useNotesStore.getState().selectedNoteId;
      if (selectedNoteId) {
        // Find the updated note in localNotes
        const updatedNote = localNotes.find((n) => {
          const noteId = n.id || (n as any)?.["@id"];
          return (
            noteId === selectedNoteId ||
            (typeof selectedNoteId === "string" && noteId && noteId.includes(selectedNoteId)) ||
            (typeof noteId === "string" && selectedNoteId && selectedNoteId.includes(noteId))
          );
        });

        // If found and it's different from what was last selected, update it
        if (updatedNote) {
          // Only update if the note content has actually changed
          // We'll let the NoteEditor's sync effect handle the actual content comparison
          // This just ensures the prop is updated with the latest note object
          onNoteSelect(updatedNote, false);
        }
      }
    }
  }, [localNotes, viewMode, onNoteSelect]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const notesToSearch = viewMode === "review" ? localNotes : notes;
    const filtered = notesToSearch.filter((note) => {
      const matchesText =
        note.title.toLowerCase().includes(query) ||
        (note.tags && Array.isArray(note.tags) && note.tags.some((tag) => tag.label.toLowerCase().includes(query)));

      if (!matchesText) return false;

      if (viewMode === "review") {
        // Unreviewed vs Reviewed in review mode
        if (showPublished) {
          // Reviewed
          return !!note.published;
        } else {
          // Unreviewed
          return !!note.approvalRequested && !note.published;
        }
      }

      // My Notes mode: Published vs Unpublished
      return showPublished ? !!note.published : !note.published;
    });
    setSearchResults(filtered);
  };

  const togglePublished = (value: string) => {
    const newShowPublished = value === "published";
    setShowPublished(newShowPublished);
    // Clear search when switching tabs
    setIsSearching(false);
    setSearchResults(null);
  };

  return (
    <div className="h-full min-w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col z-10 relative">
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-1 p-4 pb-20">
        {/* pb-20 to prevent content from going under button */}
        <div className="w-full">
          {/*Search bar only updates the set of displayed notes to filter properly when used again after switching note view.*/}
          <SearchBarNote onSearch={handleSearch} />

          <div className="flex flex-row items-center text-center justify-between pt-1 mt-2">
            {/* Experimental change. From https://ui.shadcn.com/docs/components/tabs */}
            <Tabs defaultValue={viewMode === "review" ? "unpublished" : "unpublished"} className="w-full" onValueChange={togglePublished}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unpublished" className="text-sm font-semibold">
                  {viewMode === "review" ? "Unreviewed" : "Unpublished"}
                </TabsTrigger>
                <TabsTrigger value="published" className="text-sm font-semibold">
                  {viewMode === "review" ? "Reviewed" : "Published"}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="unpublished"></TabsContent>
              <TabsContent value="published"></TabsContent>
            </Tabs>
          </div>
        </div>
        <div>
          <NoteListView
            notes={filteredNotes}
            onNoteSelect={(note) => onNoteSelect(note, false)}
            isSearching={isSearching}
            viewMode={viewMode}
            isInstructor={isInstructor}
            draftNote={!showPublished ? draftNote : null}
            onDraftSelect={() => {
              if (draftNote) {
                setSelectedNoteId("draft"); // Set special ID to indicate draft is active
                onNoteSelect(draftNote, true);
              }
            }}
          />
        </div>
      </div>

      {/* Fixed Add Note button at bottom - only show when NOT in review mode (instructor viewing student notes) */}
      {viewMode !== "review" && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200 z-10">
          <Button
            id="add-note-button"
            data-testid="add-note-button"
            onClick={handleAddNote}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg"
          >
            <Plus size={18} className="mr-2" />
            New Note
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
