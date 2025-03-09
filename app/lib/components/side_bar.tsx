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

import { Switch } from "@/components/ui/switch";

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
        isArchived: false
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
          const publishedNotes = convertedNotes.filter((note) => note.published); //filter out archived notes

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
    <div className="h-[90vh] bg-gray-200 p-4 pt-1 overflow-y-auto flex flex-col z-30 relative">
      <div className="w-full mb-4">
        <div className="text-center justify-center mb-1">
          <span className="justify-center text-xl font-semibold">My Notes</span>
        </div>
        <SearchBarNote onSearch={handleSearch} />
        <div className="p-2 pt-1 m-1 mt-2 rounded truncate cursor-pointer bg-gray-300">
          <div className="flex flex-row items-center text-center justify-between">
            <span className="mr-2 text-lg font-semibold">View</span>
          </div>
          <div className="flex flex-row items-center text-center justify-between">
            <span className="mr-2 text-sm font-semibold">Unpublished</span>
            <Switch checked={showPublished} onCheckedChange={togglePublished} />
            <span className="ml-2 text-sm font-semibold">Published</span>
          </div>
        </div>
      </div>

      <div>
        <NoteListView
          notes={filteredNotes}
          onNoteSelect={(note) => onNoteSelect(note, false)}
        />
      </div>

      {/* floating add note button */}
      <Button
        id="add-note-button"
        data-testid="add-note-button"
        onClick={handleAddNote}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black hover:bg-blue-600 text-white p-4 rounded-full shadow-lg"
      >
        <Plus size={24} />
      </Button>
    </div>
  );
};

export default Sidebar;
