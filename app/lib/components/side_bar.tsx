"use client";
import { useState, useEffect, useRef } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Importing Plus icon
import SearchBarNote from "./search_bar_note";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import ApiService from "../utils/api_service";
import introJs from "intro.js"
import "intro.js/introjs.css"
import { useNotesStore } from "../stores/notesStore";

/*
//Bring this import back to use switch toggle for note view.
import { Switch } from "@/components/ui/switch";
*/

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const user = User.getInstance();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const { notes, fetchNotes, refreshNotes, addNote } = useNotesStore();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [showPublished, setShowPublished] = useState(false); // Default to Unpublished tab
  const [isSearching, setIsSearching] = useState(false);

  const handleAddNote = async () => {
    const userId = await user.getId();
    if (userId) {
      // Create a local-only draft note (not saved to DB yet)
      const draftNote: newNote = {
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
        isArchived: false
      };
      
      // Open for editing immediately; will save when user types
      onNoteSelect(draftNote, true);
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };

  // Removed auto "add note" click to prevent accidental blank note creation

  // Fetch notes on mount
  useEffect(() => {
    const loadNotes = async () => {
      const userId = await user.getId();
      if (userId) {
        await fetchNotes(userId);
      }
    };
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Filter notes whenever notes or showPublished changes
  useEffect(() => {
    filterNotesByPublished(showPublished, notes);
  }, [notes, showPublished]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      filterNotesByPublished(showPublished);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const filtered = notes
      .filter(note => !note.isArchived) // Filter archived
      .filter(
        (note) =>
          (note.title.toLowerCase().includes(query) ||
          note.tags.some((tag) => tag.label.toLowerCase().includes(query))) &&
          (showPublished ? note.published : !note.published)
      );
    setFilteredNotes(filtered);
  };

  const filterNotesByPublished = (showPublished: boolean, notesToFilter?: Note[]) => {
    const noteList = notesToFilter || notes;
    setIsSearching(false);
    // Filter out archived notes AND filter by published status
    const filtered = noteList
      .filter(note => !note.isArchived)
      .filter(note => showPublished ? note.published : !note.published);
    setFilteredNotes(filtered);
  };

  const togglePublished = (value: string) => {
    const newShowPublished = value === "published";
    setShowPublished(newShowPublished);
    filterNotesByPublished(newShowPublished);
  };

  return (
    <div className="h-full min-w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col z-30 relative">
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-1 p-4 pb-20"> {/* pb-20 to prevent content from going under button */}
        <div className="w-full mb-4">
          {/*Search bar only updates the set of displayed notes to filter properly when used again after switching note view.*/}
          <SearchBarNote onSearch={handleSearch} />

          <div className="flex flex-row items-center text-center justify-between pt-1 mt-1"> {/* Experimental change. From https://ui.shadcn.com/docs/components/tabs */}
            <Tabs defaultValue="unpublished" className="w-full" onValueChange={togglePublished}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unpublished" className="text-sm font-semibold">Unpublished</TabsTrigger>
                <TabsTrigger value="published" className="text-sm font-semibold">Published</TabsTrigger>
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
          />
        </div>
      </div>

      {/* Fixed Add Note button at bottom */}
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
    </div>
  );
};

export default Sidebar;
