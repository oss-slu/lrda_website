"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./lib/components/side_bar";
import NoteEditor from "./lib/components/note_component";
import { Note, newNote } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | newNote>();
  const [isNewNote, setIsNewNote] = useState(false); 

  const handleNoteSelect = (note: Note | newNote, isNew: boolean) => {
    setSelectedNote(note);
    setIsNewNote(isNew);
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isNote = (note: Note | newNote): note is Note => {
    return (note as Note).id !== undefined;
  };

  return (
    <main className="relative flex h-[90vh] flex-row p-4">
      <Sidebar onNoteSelect={handleNoteSelect} />
      <ScrollArea>
        <div className="flex-1 ml-64">
<<<<<<< HEAD
          {isClient && selectedNote && isNote(selectedNote) && <NoteEditor note={selectedNote} />}
=======
          {isClient && selectedNote && (
            <NoteEditor note={selectedNote} isNewNote={isNewNote} />
          )}
>>>>>>> 73-integrate-delete-functionality-with-api-service-in-note-component
        </div>
      </ScrollArea>
    </main>
  );
}
