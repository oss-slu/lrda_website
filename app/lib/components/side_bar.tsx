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

/*
//Bring this import back to use switch toggle for note view.
import { Switch } from "@/components/ui/switch";
*/

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
  refreshKey?: number; // Add refresh trigger
};

const user = User.getInstance();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect, refreshKey }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [showPublished, setShowPublished] = useState(false); // Default to Unpublished tab

  const handleAddNote = async () => {
    const userId = await user.getId();
    if (userId) {
      // Create and immediately save a blank note
      const newBlankNote: any = {
        title: "Untitled",
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
      
      try {
        // Save to database immediately
        const response = await ApiService.writeNewNote(newBlankNote);
        
        if (!response.ok) {
          throw new Error('Failed to create note');
        }
        
        const data = await response.json();
        
        // Ensure we have a valid ID from the response
        const noteId = data['@id'] || data.id;
        if (!noteId) {
          console.error('No ID returned from API:', data);
          throw new Error('Note created but no ID returned');
        }
        
        // Create the note object with the ID from the API
        const savedNote = {
          ...newBlankNote,
          id: noteId,
          uid: data.uid || noteId, // Use ID as fallback for uid
        };
        
        // Refresh sidebar to show the new note
        const updatedNotes = await ApiService.fetchUserMessages(userId);
        const convertedNotes = DataConversion.convertMediaTypes(updatedNotes).reverse();
        const unarchivedNotes = convertedNotes.filter((note: Note) => !note.isArchived);
        setNotes(unarchivedNotes);
        
        // Open the newly created note for editing
        onNoteSelect(savedNote, false);
      } catch (error) {
        console.error("Error creating note:", error);
        // Show error to user
        alert("Failed to create note. Please try again.");
      }
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const addNote = document.getElementById("add-note-button");

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
          // Fetch all notes first
          const userNotes = await ApiService.fetchUserMessages(userId);
          const convertedNotes = DataConversion.convertMediaTypes(userNotes).reverse();

          // Debug: Log ALL notes with their archive status
          console.log('All notes from API:', convertedNotes.map(n => ({
            title: n.title || 'Untitled',
            id: n.id?.slice(-8),
            isArchived: n.isArchived
          })));

          // Filter out archived notes AFTER conversion
          const unarchivedNotes = convertedNotes.filter((note) => {
            const isArchived = note.isArchived === true;
            return !isArchived;
          });
          
          // Debug: Log filtering results
          const totalNotes = convertedNotes.length;
          const unarchivedCount = unarchivedNotes.length;
          const archivedCount = totalNotes - unarchivedCount;
          
          console.log(`Notes fetched: ${totalNotes} total, ${unarchivedCount} active, ${archivedCount} archived`);

          setNotes(unarchivedNotes);
          // Apply the current filter (respect the currently selected tab)
          filterNotesByPublished(showPublished, unarchivedNotes);
        } else {
          console.error("User not logged in");
        }
      } catch (error) {
        console.error("Error fetching user messages:", error);
      }
    };
    fetchUserMessages();
  }, [refreshKey]); // Re-fetch when refreshKey changes

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

  const filterNotesByPublished = (showPublished: boolean, notesToFilter?: Note[]) => {
    const noteList = notesToFilter || notes;
    const filtered = noteList.filter(note => showPublished ? note.published : !note.published);
    setFilteredNotes(filtered);
  };

  const togglePublished = (value: string) => {
    const newShowPublished = value === "published";
    setShowPublished(newShowPublished);
    filterNotesByPublished(newShowPublished);
  };

  return (
    <div className="h-full bg-gray-50 border-r border-gray-200 p-4 pt-1 overflow-y-auto flex flex-col z-30 relative">
      <div className="w-full mb-4">
        <div className="text-left mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
        </div>
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
        />
      </div>

      {/* Add note button */}
      <Button
        id="add-note-button"
        data-testid="add-note-button"
        onClick={handleAddNote}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Plus size={18} className="mr-2" />
        New Note
      </Button>
    </div>
  );
};

export default Sidebar;
