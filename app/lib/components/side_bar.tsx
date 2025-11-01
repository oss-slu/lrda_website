"use client";
import { useState, useEffect, useRef } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react"; // Importing Plus icon
import SearchBarNote from "./search_bar_note";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";
// intro.js will be loaded dynamically to avoid SSR issues

//Bring this import back to use switch toggle for note view.
import { Switch } from "@/components/ui/switch";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const user = User.getInstance();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [showPublished, setShowPublished] = useState(true);
  const [viewMode, setViewMode] = useState<"my" | "review">("my");
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  const handleAddNote = async () => {
    const userId = await user.getId();
    if (userId) {
      const newBlankNote: newNote = {
        title: "",
        text: "",
        time: new Date(),
        media: [],
        audio: [],
        creator: userId,
        latitude: "",
        longitude: "",
        published: undefined,
        tags: [],
        isArchived: false,
        approvalRequested: undefined,
      };
      onNoteSelect(newBlankNote, true); // Notify that a new note is being added
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const addNote = document.getElementById("add-note-button");
      console.log('Observer triggered');

      if (addNote && typeof window !== 'undefined') {
        import('intro.js').then((introJsModule) => {
          const introJs = introJsModule.default;
          const intro = introJs();
          intro.setOptions({
            scrollToElement: false,
            skipLabel: "Skip",
          });
          intro.start();

          if (addNote) {
            addNote.click();
          }

          // Apply inline styling to the skip button after a short delay to ensure it has rendered
          setTimeout(() => {
            const skipButton = document.querySelector('.introjs-skipbutton') as HTMLElement;
            if (skipButton) {
              skipButton.style.position = 'absolute';
              skipButton.style.top = '2px'; // Move it up by decreasing the top value
              skipButton.style.right = '20px'; // Adjust positioning as needed
              skipButton.style.fontSize = '18px'; // Adjust font size as needed
              skipButton.style.padding = '4px 10px'; // Adjust padding as needed
            }
          }, 100); // 100ms delay to wait for rendering
        });

        observer.disconnect(); // Stop observing once the elements are found
      }
    });

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const initRoleFlags = async () => {
      const roles = await user.getRoles();
      const isInstr = await user.isInstructor();
      setIsInstructor(!!isInstr);
      setInstructorId(user.getInstructorId());
    };
    initRoleFlags();
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const userId = await user.getId();
        if (!userId) {
          console.error("User not logged in");
          return;
        }

        if (viewMode === "my") {
          const userNotes = (await ApiService.fetchUserMessages(userId)).filter((note) => !note.isArchived);
          const convertedNotes = DataConversion.convertMediaTypes(userNotes).reverse();
          const unarchivedNotes = convertedNotes.filter((note) => !note.isArchived);
          const publishedNotes = convertedNotes.filter((note) => note.published);
          setNotes(unarchivedNotes);
          setFilteredNotes(publishedNotes);
        } else if (viewMode === "review" && isInstructor) {
          // Instructor reviewing student notes
          // Get instructor's userData which contains the students array
          const instructorData = await ApiService.fetchUserData(userId);
          if (!instructorData || !instructorData.isInstructor) {
            console.warn("User is not an instructor");
            setNotes([]);
            setFilteredNotes([]);
            return;
          }
          
          const studentUids = instructorData.students || [];
          console.log("📝 Student UIDs from instructor data:", studentUids);
          
          if (studentUids.length === 0) {
            console.warn("No students found for instructor");
            setNotes([]);
            setFilteredNotes([]);
            return;
          }
          
          // Fetch approval-requested notes from students (matches commit behavior)
          // Note: This will only fetch notes with approvalRequested=true and published=false
          const allNotes = await ApiService.fetchNotesByStudents(studentUids);
          console.log("📋 All student notes fetched:", allNotes.length);
          const converted = DataConversion.convertMediaTypes(allNotes).reverse();
          const unarchived = converted.filter((n) => !n.isArchived);
          console.log("📋 Total unarchived notes:", unarchived.length);
          
          // Set all notes, then filter by tab selection
          setNotes(unarchived);
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
    fetchNotes();
  }, [viewMode, isInstructor]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      filterNotesByPublished(showPublished);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = notes.filter((note) => {
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

  const filterNotesByPublished = (showPublished: boolean) => {
    let filtered: Note[] = [];
    if (viewMode === "review") {
      if (showPublished) {
        // Reviewed
        filtered = notes.filter((n) => !!n.published);
      } else {
        // Under Review
        filtered = notes.filter((n) => !!n.approvalRequested && !n.published);
      }
    } else {
      filtered = notes.filter((note) => (showPublished ? !!note.published : !note.published));
    }
    setFilteredNotes(filtered);
  };

  const togglePublished = (newShowPublished?: boolean) => {
    const updated = newShowPublished !== undefined ? newShowPublished : !showPublished;
    setShowPublished(updated);
    filterNotesByPublished(updated);
  };

  return (
    <div className="h-[100vh] sm:h-[90vh] bg-gray-200 p-2 sm:p-4 pt-2 sm:pt-1 overflow-y-auto flex flex-col z-30 relative">
      <div className="w-full mb-2 sm:mb-4">
        <div className="text-center justify-center mb-2 sm:mb-1">
          <span className="justify-center text-base sm:text-lg lg:text-xl font-semibold">
            {isInstructor ? "Instructor Workspace" : "My Notes"}
          </span>
        </div>
        {/*Search bar only updates the set of displayed notes to filter properly when used again after switching note view.*/}
        <div className="mb-2 sm:mb-3">
          <SearchBarNote onSearch={handleSearch} />
        </div>
          {isInstructor && (
            <div className="mb-2">
              <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
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

          <div className="flex flex-col sm:flex-row items-center text-center justify-between pt-1 sm:pt-2 mt-1 sm:mt-2 w-full"> {/* Mobile-first layout */}
            <Tabs defaultValue={viewMode === "review" ? "unpublished" : "published"} className="w-full" onValueChange={(value) => {
              const isPublishedTab = value === "published";
              togglePublished(isPublishedTab);
            }}>
              <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2">
                <TabsTrigger 
                  value="unpublished" 
                  className="text-xs sm:text-sm font-semibold px-1 sm:px-2 py-1.5 sm:py-2 h-8 sm:h-9 rounded-md"
                >
                  {viewMode === "review" ? "Under Review" : "Unpublished"}
                </TabsTrigger>
                <TabsTrigger 
                  value="published" 
                  className="text-xs sm:text-sm font-semibold px-1 sm:px-2 py-1.5 sm:py-2 h-8 sm:h-9 rounded-md"
                >
                  {viewMode === "review" ? "Reviewed" : "Published"}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="unpublished"></TabsContent>
              <TabsContent value="published"></TabsContent>
            </Tabs>
          </div>
        </div>

      <div className="flex-1 relative">
        <div className="sticky top-0 z-40 bg-gray-200 p-2 border-b border-gray-300">
          <Button
            id="add-note-button"
            data-testid="add-note-button"
            onClick={handleAddNote}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center py-2"
          >
            <div className="text-lg font-bold mr-2">+</div>
            <span className="text-sm">Add Note</span>
          </Button>
        </div>
        <NoteListView
          notes={filteredNotes}
          onNoteSelect={(note) => onNoteSelect(note, false)}
        />
      </div>
    </div>
  );
};

export default Sidebar;