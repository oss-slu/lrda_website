"use client";
import Sidebar from "./lib/components/side_bar";
import NoteComponent from "./lib/components/note_component";
import { User } from "./lib/models/user_class";
import { SetStateAction, useState } from "react";

// Initialize user
const user = User.getInstance();

// Home component
export default function Home() {
  // State to control the visibility of the NoteComponent
  const [isNoteComponentVisible, setNoteComponentVisible] = useState(false);

  // Function to close the NoteComponent
  const handleCloseNoteComponent = () => {
    setNoteComponentVisible(false);
  };

  return (
    <main className="relative flex h-screen flex-row p-24">
      {/* Pass setNoteComponentVisible to Sidebar */}
      <Sidebar setNoteComponentVisible={setNoteComponentVisible} setToolPageVisible={function (value: SetStateAction<boolean>): void {
      } } toolPageVisible={false} />

      <div className="flex-1 ml-64">
        {/* Render NoteComponent only if isNoteComponentVisible is true */}
        {isNoteComponentVisible && <NoteComponent onClose={handleCloseNoteComponent} />}
      </div>
    </main>
  );
}