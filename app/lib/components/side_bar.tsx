"use client";
import { useState, useEffect } from "react";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import SearchBar from "./search_bar";
import NoteListView from "./note_listview";
import { Note, newNote } from "@/app/types";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";
import userDemoNotes from "../models/user_notes_demo.json";
import { toast } from "sonner";

type SidebarProps = {
  onNoteSelect: (note: Note | newNote) => void;
};

const user = User.getInstance();
const userId = user.getId();

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  
  const handleAddNote = async () => {
    // Since `userId` is a Promise, you have to await it
    const userId = await user.getId();

    // Make sure `userId` is not null before proceeding
    if (userId) {
      const newBlankNote: newNote = {
        title: '',
        text: '',
        time: new Date(),
        media: [],
        audio: [],
        creator: userId, // Now we have the userId correctly set
        latitude: '',
        longitude: '',
        published: undefined,
        tags: []
      };

      // Call `onNoteSelect` with the new blank note
      onNoteSelect(newBlankNote);
    } else {
      console.error("User ID is null - cannot create a new note");
    }
  };


  useEffect(() => {
    const fetchUserMessages = async () => {
      try {
        const userId = await user.getId();
        if (!userId) {
          const userNotes = userDemoNotes;
          console.log("User Notes: ", userNotes);
          setNotes(DataConversion.convertMediaTypes(userNotes).reverse());
          setFilteredNotes(DataConversion.convertMediaTypes(userNotes).reverse());
        } else if (userId){
          const userNotes = await ApiService.fetchUserMessages(userId);
          console.log("User Notes: ", userNotes);
          setNotes(DataConversion.convertMediaTypes(userNotes).reverse());
          setFilteredNotes(DataConversion.convertMediaTypes(userNotes).reverse());
        }else{ console.error("User not logged in");
        }
      } catch (error) {
        console.error("Error fetching user messages:", error);
      }
    };

    fetchUserMessages();
  }, []);

  const handleSearch = (searchQuery: string) => {
      toast("Demo Note", {
        description: "Reminder you cannot save in Demo mode.",
        duration: 4000,
      });
      toast("Demo Note", {
        description: "Feel free to play around all you like!",
        duration: 4000,
      });
    
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(query) || 
      note.tags.some(tag => tag.toLowerCase().includes(query))
    );
    setFilteredNotes(filtered);
  };

  return (
    <div className="absolute top-0 left-0 h-[90vh] w-64 bg-gray-200 p-4 overflow-y-auto flex flex-col z-30">
      <div className="w-full mb-4">
        <SearchBar onSearch={handleSearch}/>
      </div>
      <Button data-testid="add-note-button" onClick={handleAddNote}>
        Add Note
      </Button>
      <div>
        <NoteListView notes={filteredNotes} onNoteSelect={onNoteSelect} />
      </div>
      
    </div>
  );
};


export default Sidebar;

