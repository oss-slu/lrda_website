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
import introJs from "intro.js"
import "intro.js/introjs.css"

//Bring this import back to use switch toggle for note view.
import { Switch } from "@/components/ui/switch";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const user = User.getInstance();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [showPublished, setShowPublished] = useState(true);

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

      if (addNote) {
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

        observer.disconnect(); // Stop observing once the elements are found
      }
    });

    // Start observing the body for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup the observer when the component unmounts
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchUserMessages = async () => {
      try {
        const userId = await user.getId();
        if (userId) {
          const userNotes = (await ApiService.fetchUserMessages(userId)).filter((note) => !note.isArchived); // filter here?
          const convertedNotes = DataConversion.convertMediaTypes(userNotes).reverse();

          const unarchivedNotes = convertedNotes.filter((note) => !note.isArchived); //filter out archived notes
          const publishedNotes = convertedNotes.filter((note) => note.published); //filter out unpublished notes

          setNotes(unarchivedNotes);
          setFilteredNotes(publishedNotes);
        } else {
          console.error("User not logged in");
        }
      } catch (error) {
        console.error("Error fetching user messages:", error);
      }
    };
    fetchUserMessages();
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      filterNotesByPublished(showPublished);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        (note.title.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.label.toLowerCase().includes(query))) &&
        (showPublished ? note.published : !note.published)
    );
    setFilteredNotes(filtered);
  };

  const filterNotesByPublished = (showPublished: boolean) => {
    const filtered = notes.filter(note => showPublished ? note.published : !note.published);
    setFilteredNotes(filtered);
  };

  const togglePublished = () => {
    const newShowPublished = !showPublished;
    setShowPublished(newShowPublished);
    filterNotesByPublished(newShowPublished);
  };

  return (
    <div className="h-[100vh] sm:h-[90vh] bg-gray-200 p-2 sm:p-4 pt-2 sm:pt-1 overflow-y-auto flex flex-col z-30 relative">
      <div className="w-full mb-2 sm:mb-4">
        <div className="text-center justify-center mb-2 sm:mb-1">
          <span className="justify-center text-base sm:text-lg lg:text-xl font-semibold">My Notes</span>
        </div>
        {/*Search bar only updates the set of displayed notes to filter properly when used again after switching note view.*/}
        <div className="mb-2 sm:mb-3">
          <SearchBarNote onSearch={handleSearch} />
        </div>

          <div className="flex flex-col sm:flex-row items-center text-center justify-between pt-1 sm:pt-2 mt-1 sm:mt-2 w-full"> {/* Mobile-first layout */}
            <Tabs defaultValue="published" className="w-full" onValueChange={togglePublished}>
              <TabsList className="grid w-full grid-cols-2 gap-1 sm:gap-2">
                <TabsTrigger 
                  value="unpublished" 
                  className="text-xs sm:text-sm font-semibold px-1 sm:px-2 py-1.5 sm:py-2 h-8 sm:h-9 rounded-md"
                >
                  Unpublished
                </TabsTrigger>
                <TabsTrigger 
                  value="published" 
                  className="text-xs sm:text-sm font-semibold px-1 sm:px-2 py-1.5 sm:py-2 h-8 sm:h-9 rounded-md"
                >
                  Published
                </TabsTrigger>
              </TabsList>
              <TabsContent value="unpublished"></TabsContent>
              <TabsContent value="published"></TabsContent>
            </Tabs>
          </div>
        </div>

      <div className="flex-1">
        <NoteListView
          notes={filteredNotes}
          onNoteSelect={(note) => onNoteSelect(note, false)}
        />
      </div>

      {/* floating add note button */}
      <Button
        id="add-note-button"
        onClick={handleAddNote}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50 flex items-center justify-center"
      >
        <div className="text-xl sm:text-2xl font-bold">+</div>
      </Button>
    </div>
  );
};

export default Sidebar;