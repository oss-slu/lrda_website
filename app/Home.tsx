"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "./lib/components/side_bar";
import NoteEditor from "./lib/components/noteElements/note_component";
import { Note, newNote } from "./types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
    <ResizablePanelGroup
      direction="horizontal"
    >
      <ResizablePanel minSize={15} maxSize={30} defaultSize={20}>
        <Sidebar onNoteSelect={handleNoteSelect} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>
          {isClient && selectedNote && (
            <NoteEditor note={selectedNote} isNewNote={isNewNote} />
          )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
