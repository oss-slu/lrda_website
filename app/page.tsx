"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./lib/components/side_bar";
import NoteEditor from "./lib/components/note_component";
import { Note, newNote } from "./types";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | newNote>();

  const handleNoteSelect = (note: Note | newNote) => {
    setSelectedNote(note);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);


  return (
    <main className="relative flex h-screen flex-row p-4">
      <Sidebar onNoteSelect={handleNoteSelect} />
      <div className="flex-1 ml-64">

      {isClient && <NoteEditor note={selectedNote} />}
      </div>
    </main>
  );
}
