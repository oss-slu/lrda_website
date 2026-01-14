"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchBarNote from "./search_bar_note";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import { useNotesStore } from "../stores/notesStore";
import { useAuthStore } from "../stores/authStore";
import { useShallow } from "zustand/react/shallow";
import ApiService from "../utils/api_service";
import { useStudentNotes } from "../hooks/queries/useNotes";

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
  const [showPublished, setShowPublished] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [isInstructor, setIsInstructor] = useState<boolean>(false);

  console.log("Sidebar render");

  // TanStack Query for student notes (instructor review mode) with automatic polling
  const { data: studentNotes = [] } = useStudentNotes(user?.uid ?? null, isInstructor && viewMode === "review");

  const handleAddNote = async () => {
    const userId = user?.uid;
    if (userId) {
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

      setDraftNote(newDraftNote);
      setSelectedNoteId("draft");
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

      let userData = null;
      try {
        userData = await ApiService.fetchUserData(userId);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      const isInstr = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructor(isInstr);
    };
    initRoleFlags();
  }, [user]);

  // Fetch personal notes for "my" mode
  useEffect(() => {
    if (viewMode === "my" && user?.uid) {
      fetchNotes(user.uid);
    }
  }, [viewMode, user?.uid, fetchNotes]);

  // Reset to showing "Unreviewed" when switching to review mode
  useEffect(() => {
    if (viewMode === "review") {
      setShowPublished(false);
    }
  }, [viewMode]);

  // Derive filteredNotes from source data
  const filteredNotes = useMemo(() => {
    if (isSearching && searchResults !== null) {
      return searchResults;
    }

    const notesToFilter = viewMode === "review" ? studentNotes : notes;

    if (viewMode === "review") {
      if (showPublished) {
        return notesToFilter.filter((n) => !n.isArchived && !!n.published);
      } else {
        return notesToFilter.filter((n) => !n.isArchived && !!n.approvalRequested && !n.published);
      }
    } else {
      return notesToFilter.filter((note) => !note.isArchived && (showPublished ? note.published : !note.published));
    }
  }, [notes, studentNotes, showPublished, viewMode, isSearching, searchResults]);

  // Update selected note when it changes in studentNotes (for instructor review mode)
  useEffect(() => {
    if (viewMode === "review" && studentNotes.length > 0) {
      const selectedNoteId = useNotesStore.getState().selectedNoteId;
      if (selectedNoteId) {
        const updatedNote = studentNotes.find((n) => {
          const noteId = n.id || (n as any)?.["@id"];
          return (
            noteId === selectedNoteId ||
            (typeof selectedNoteId === "string" && noteId && noteId.includes(selectedNoteId)) ||
            (typeof noteId === "string" && selectedNoteId && selectedNoteId.includes(noteId))
          );
        });

        if (updatedNote) {
          onNoteSelect(updatedNote, false);
        }
      }
    }
  }, [studentNotes, viewMode, onNoteSelect]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const notesToSearch = viewMode === "review" ? studentNotes : notes;
    const filtered = notesToSearch.filter((note) => {
      const matchesText =
        note.title.toLowerCase().includes(query) ||
        (note.tags && Array.isArray(note.tags) && note.tags.some((tag) => tag.label.toLowerCase().includes(query)));

      if (!matchesText) return false;

      if (viewMode === "review") {
        if (showPublished) {
          return !!note.published;
        } else {
          return !!note.approvalRequested && !note.published;
        }
      }

      return showPublished ? !!note.published : !note.published;
    });
    setSearchResults(filtered);
  };

  const togglePublished = (value: string) => {
    const newShowPublished = value === "published";
    setShowPublished(newShowPublished);
    setIsSearching(false);
    setSearchResults(null);
  };

  return (
    <div className="h-full min-w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col z-10 relative">
      <div className="overflow-y-auto flex-1 p-4 pb-20">
        <div className="w-full">
          <SearchBarNote onSearch={handleSearch} />

          <div className="flex flex-row items-center text-center justify-between pt-1 mt-2">
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
                setSelectedNoteId("draft");
                onNoteSelect(draftNote, true);
              }
            }}
          />
        </div>
      </div>

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
