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
        dontShowAgain: true,
        skipLabel: "Skip",
      });

      intro.start();
      if (addNote) {
        addNote.click();
      }
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
          const userNotes = await ApiService.fetchUserMessages(userId);
          const convertedNotes =
            DataConversion.convertMediaTypes(userNotes).reverse();
          setNotes(convertedNotes);
          setFilteredNotes(convertedNotes);
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
