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
import { User } from './lib/models/user_class';

export default function Home() {
  const [selectedNote, setSelectedNote] = useState<Note | newNote>();
  const [isNewNote, setIsNewNote] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const user = User.getInstance();
    // Add a slight delay before checking the login state
    setTimeout(() => {
      user.setLoginCallback((isLoggedIn) => {
        setIsUserLoggedIn(isLoggedIn);
      });
      // Manually check the initial login state
      setIsUserLoggedIn(user !== null);
    }, 100); // Adjust the delay as needed
  }, []);

  const handleNoteSelect = (note: Note | newNote, isNew: boolean) => {
    setSelectedNote(note);
    setIsNewNote(isNew);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      <ResizablePanel
        minSize={20}
        maxSize={40}
        defaultSize={25}
        collapsible={true}
        collapsedSize={1}
        className="w-full sm:w-auto"
      >
        <Sidebar onNoteSelect={handleNoteSelect} />
      </ResizablePanel>
      <ResizableHandle withHandle className="bg-gray-200 hover:bg-gray-300 cursor-col-resize" />
      <ResizablePanel defaultSize={75} className="w-full sm:w-auto">
        {isUserLoggedIn ? (
          selectedNote ? (
            <NoteEditor note={selectedNote} isNewNote={isNewNote} />
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center text-xl sm:text-2xl lg:text-3xl font-bold p-4 text-center">
              <div className="mb-6 sm:mb-10">Please select a note to start editing or add a new one!</div>
            </div>
          )
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center text-xl sm:text-2xl lg:text-3xl font-bold p-4 text-center">
            <div className="mb-6 sm:mb-10">You must be logged in to create notes!</div>
            <button
              onClick={() => (window.location.href = "/lib/pages/loginPage")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 sm:py-3 sm:px-6 border border-blue-700 rounded shadow text-sm sm:text-base"
            >
              Login Here
            </button>
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}