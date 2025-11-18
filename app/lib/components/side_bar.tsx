"use client";
import { useState, useEffect } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import SearchBarNote from "./search_bar_note";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import "intro.js/introjs.css";
import { useNotesStore } from "../stores/notesStore";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const user = User.getInstance();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const { notes, fetchNotes } = useNotesStore();
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [showPublished, setShowPublished] = useState(false); // Default to Unpublished tab
  const [isSearching, setIsSearching] = useState(false);
  // Teacher-student view mode (from december-sprint)
  const [viewMode, setViewMode] = useState<"my" | "review">("my");
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [localNotes, setLocalNotes] = useState<Note[]>([]); // Local notes for review mode

  console.log("Sidebar render");
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
        isArchived: false,
      };

      // Open for editing immediately; will save when user types
      onNoteSelect(draftNote, true);
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };

  // Initialize instructor role
  useEffect(() => {
    const initRoleFlags = async () => {
      const roles = await user.getRoles();
      const userId = await user.getId();
      
      // Fetch userData to check isInstructor flag
      let userData = null;
      if (userId) {
        try {
          userData = await ApiService.fetchUserData(userId);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      
      // Check if user is an instructor (has administrator role OR isInstructor flag in userData)
      // Allow toggle for administrators even if isInstructor flag isn't set
      const isInstr = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructor(isInstr);
    };
    initRoleFlags();
  }, []);

  // Fetch notes based on view mode
  useEffect(() => {
    const fetchNotesForView = async () => {
      try {
        const userId = await user.getId();
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
            setFilteredNotes([]);
            return;
          }
          
          const studentUids = instructorData.students || [];
          console.log("📝 Student UIDs from instructor data:", studentUids);
          
          if (studentUids.length === 0) {
            console.warn("No students found for instructor");
            setLocalNotes([]);
            setFilteredNotes([]);
            return;
          }
          
          // Fetch all notes from students
          const allNotes = await ApiService.fetchNotesByStudents(studentUids);
          console.log("📋 All student notes fetched:", allNotes.length);
          const converted = DataConversion.convertMediaTypes(allNotes).reverse();
          const unarchived = converted.filter((n) => !n.isArchived);
          console.log("📋 Total unarchived notes:", unarchived.length);
          
          setLocalNotes(unarchived);
          // Default to showing "Under Review" (awaiting approval)
          const awaitingApproval = unarchived.filter((n) => n.approvalRequested && !n.published);
          console.log("⏳ Awaiting approval count:", awaitingApproval.length);
          setFilteredNotes(awaitingApproval);
          setShowPublished(false);
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
      }
    };
    fetchNotesForView();
  }, [viewMode, isInstructor, fetchNotes]);

  // Filter notes whenever notes or showPublished changes
  useEffect(() => {
    const notesToFilter = viewMode === "review" ? localNotes : notes;
    filterNotesByPublished(showPublished, notesToFilter);
  }, [notes, localNotes, showPublished, viewMode]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      filterNotesByPublished(showPublished);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const notesToSearch = viewMode === "review" ? localNotes : notes;
    const filtered = notesToSearch.filter((note) => {
      const matchesText =
        note.title.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.label.toLowerCase().includes(query));

      if (!matchesText) return false;

      if (viewMode === "review") {
        // Under Review vs Reviewed in review mode
        if (showPublished) {
          // Reviewed
          return !!note.published;
        } else {
          // Under Review
          return !!note.approvalRequested && !note.published;
        }
      }

      // My Notes mode: Published vs Unpublished
      return showPublished ? !!note.published : !note.published;
    });
    setFilteredNotes(filtered);
  };

  const filterNotesByPublished = (showPublished: boolean, notesToFilter?: Note[]) => {
    const noteList = notesToFilter || (viewMode === "review" ? localNotes : notes);
    setIsSearching(false);
    let filtered: Note[] = [];
    
    if (viewMode === "review") {
      // Review mode: Under Review vs Reviewed
      if (showPublished) {
        // Reviewed
        filtered = noteList.filter((n) => !n.isArchived && !!n.published);
      } else {
        // Under Review
        filtered = noteList.filter((n) => !n.isArchived && !!n.approvalRequested && !n.published);
      }
    } else {
      // My Notes mode: Published vs Unpublished
      filtered = noteList.filter((note) => !note.isArchived).filter((note) => (showPublished ? note.published : !note.published));
    }
    
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
      <div className="overflow-y-auto flex-1 p-4 pb-20">
        {" "}
        {/* pb-20 to prevent content from going under button */}
        <div className="w-full mb-4">
          {/*Search bar only updates the set of displayed notes to filter properly when used again after switching note view.*/}
          <SearchBarNote onSearch={handleSearch} />

          {/* View mode selector for instructors */}
          {isInstructor && (
            <div className="mb-2 mt-2">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as "my" | "review")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="my">My Notes</SelectItem>
                  <SelectItem value="review">Review Notes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-row items-center text-center justify-between pt-1 mt-1">
            {" "}
            {/* Experimental change. From https://ui.shadcn.com/docs/components/tabs */}
            <Tabs defaultValue={viewMode === "review" ? "unpublished" : "unpublished"} className="w-full" onValueChange={togglePublished}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="unpublished" className="text-sm font-semibold">
                  {viewMode === "review" ? "Under Review" : "Unpublished"}
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
