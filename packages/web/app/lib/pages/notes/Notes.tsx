"use client";
import React, { useState, useEffect } from "react";
import Sidebar from "../../components/side_bar";
import NoteEditor from "../../components/noteElements/note_component";
import { Note, newNote } from "../../../types";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useNotesStore } from "../../stores/notesStore";
import { useAuthStore } from "../../stores/authStore";
import { useShallow } from "zustand/react/shallow";

export default function Notes() {
  const { fetchNotes, setSelectedNoteId } = useNotesStore(
    useShallow((state) => ({
      fetchNotes: state.fetchNotes,
      setSelectedNoteId: state.setSelectedNoteId,
    }))
  );

  const { user, isLoggedIn } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
    }))
  );

  const [selectedNote, setSelectedNote] = useState<Note | newNote>();
  const [isNewNote, setIsNewNote] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  console.log("Notes page render");

  // Fetch notes when user logs in
  useEffect(() => {
    const loadNotes = async () => {
      const userId = user?.uid;
      if (userId) {
        await fetchNotes(userId);
      }
    };
    loadNotes();
  }, [user?.uid, fetchNotes]);

  const handleNoteSelect = (note: Note | newNote, isNew: boolean) => {
    setSelectedNote(note);
    setIsNewNote(isNew);
    // Remove success banner/message per request
    setDebugInfo("");
  };

  const handleNoteDeleted = () => {
    const currentNotes = useNotesStore.getState().notes;
    setSelectedNote(currentNotes[0] || undefined);
    setSelectedNoteId(currentNotes[0]?.id || null);
  };

  return (
    <ResizablePanelGroup direction="horizontal" autoSaveId="notes-layout">
      <ResizablePanel minSize={22} maxSize={30} defaultSize={26} collapsible={true} collapsedSize={1}>
        <Sidebar onNoteSelect={handleNoteSelect} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        {/* Main content area */}
        <div className="h-full flex flex-col relative min-h-0">
          {isLoggedIn ? (
            selectedNote ? (
              <div className="h-full w-full min-h-0 flex flex-col">
                <NoteEditor note={selectedNote} isNewNote={isNewNote} onNoteDeleted={handleNoteDeleted} />
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
