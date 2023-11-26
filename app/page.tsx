"use client";
import React, { useState } from "react";
import Sidebar from "./lib/components/side_bar";
import ToolPage from "./lib/components/note_component";

export default function Home() {
  const [selectedNoteText, setSelectedNoteText] = useState<string>("");

  const handleNoteSelect = (noteText: string) => {
    setSelectedNoteText(noteText);
  };

  return (
    <main className="relative flex h-screen flex-row p-24">
      <Sidebar onNoteSelect={handleNoteSelect} />
      <div className="flex-1 ml-64">
        <ToolPage text={selectedNoteText} />
      </div>
    </main>
  );
}

