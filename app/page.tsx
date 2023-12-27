"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./lib/components/side_bar";
import NoteEditor from "./lib/components/note_component";
import NoteCard from "./lib/components/note_card";
import { Note } from "./types";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note>();
  const [NoteComponent, setNoteComponent] = useState<React.ElementType | null>(
    null
  );

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
  };

  useEffect(() => {
    setIsClient(true);
    // Dynamically import the Note component based on the window location
    async function loadComponent() {
      if (window.location.pathname.includes("/map/")) {
        setNoteComponent(() => NoteCard);
      } else {
        setNoteComponent(() => NoteEditor);
      }
    }

    if (process.browser) {
      loadComponent();
    }
  }, []);

  return (
    <main className="relative flex h-screen flex-row p-4">
      <Sidebar onNoteSelect={handleNoteSelect} />
      <div className="flex-1 ml-64">
        {isClient && NoteComponent ? (
          <NoteComponent note={selectedNote} />
        ) : null}
      </div>
    </main>
  );
}
