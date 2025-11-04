"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/side_bar";
import NoteEditor from "../../components/noteElements/note_component";
import { Note, newNote } from "../../../types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { User } from "../../models/user_class";

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState<Note | newNote>();
  const [isNewNote, setIsNewNote] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0); // Add refresh trigger

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
    // Remove success banner/message per request
    setDebugInfo("");
  };

  const handleNoteSaved = () => {
    // Increment the refresh key to trigger sidebar re-fetch
    setSidebarRefreshKey(prev => prev + 1);
    // Don't clear the note - keep it open so user can continue editing
  };

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel
        minSize={15}
        maxSize={30}
        defaultSize={20}
        collapsible={true}
        collapsedSize={1}
      >
        <Sidebar onNoteSelect={handleNoteSelect} refreshKey={sidebarRefreshKey} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        {/* Main content area */}
        <div className="h-full flex flex-col relative min-h-0">
          {isUserLoggedIn ? (
            selectedNote ? (
              <div className="h-full w-full min-h-0 flex flex-col">

                <NoteEditor note={selectedNote} isNewNote={isNewNote} onNoteSaved={handleNoteSaved} />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center text-3xl font-bold">
                <div className="mb-10">Please select a note to start editing or add a new one!</div>
              </div>
            )
          ) : (
            <div className="w-full h-full flex flex-col justify-center items-center text-3xl font-bold">
              <div className="mb-10">You must be logged in to create notes!</div>
              <button
                onClick={() => (window.location.href = "/lib/pages/loginPage")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
              >
                Login Here
              </button>
            </div>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
