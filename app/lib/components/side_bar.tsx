"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import SearchBar from "./search_bar";
import NoteListView from "./note_listview";
import { Note } from "@/app/types";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";


type SidebarProps = {
  onNoteSelect: (note: Note) => void;
};

const user = User.getInstance();
const userId = user.getId();


const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

  useEffect(() => {
    const fetchUserMessages = async () => {
      try {
        const userId = await user.getId();
        if (userId) {
          const userNotes = await ApiService.fetchUserMessages(userId);
          setNotes(DataConversion.convertMediaTypes(userNotes).reverse());
          setFilteredNotes(DataConversion.convertMediaTypes(userNotes).reverse());
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
    const filtered = notes.filter(note =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredNotes(filtered);
  };

  return (
    <div className="absolute top-0 left-0 h-screen w-64 bg-gray-200 p-4 overflow-y-auto flex flex-col">
      <div className="w-full">
        <SearchBar onSearch={handleSearch} />
      </div>
      <div>
        <NoteListView notes={filteredNotes} onNoteSelect={onNoteSelect} />
      </div>
      <Button data-testid="add-note-button">Add Note</Button>
    </div>
  );
};


export default Sidebar;

