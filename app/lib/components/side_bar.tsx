"use client";
import { useState, useEffect, useRef } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import SearchBarNote from "./search_bar_note";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";
import introJs from "intro.js"
import "intro.js/introjs.css"

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const user = User.getInstance();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

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
        isArchived: false
      };
      onNoteSelect(newBlankNote, true); // Notify that a new note is being added
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
    const  addNote = document.getElementById("add-note-button");
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


          setNotes(unarchivedNotes);
          setFilteredNotes(unarchivedNotes);
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
      setFilteredNotes(notes);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.label.toLowerCase().includes(query)) // Access the label property
    );
    setFilteredNotes(filtered);
  };

  return (
//move this button to a circle button with a plus icon at the bottom of the side bar
    <div className="h-[90vh] bg-gray-200 p-4 overflow-y-auto flex flex-col z-30">
      <div className="w-full mb-4">
        <SearchBarNote onSearch={handleSearch} />
      </div >
      <Button id = 'add-note-button' data-testid="add-note-button" onClick={handleAddNote}>
        Add Note
      </Button> 
      <div>
        <NoteListView
          notes={filteredNotes}
          onNoteSelect={(note) => onNoteSelect(note, false)}
           
        />
      </div>
    </div>
  );
};

export default Sidebar;
