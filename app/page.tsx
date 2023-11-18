'use client'
import { useState } from "react";
import SearchBar from "./lib/components/search_bar";
import Sidebar from "./lib/components/side_bar";
import NoteComponent from "./lib/components/note_component";
import { User } from "./lib/models/user_class";

const user = User.getInstance();

export default function Home() {
  const [isNoteComponentVisible, setNoteComponentVisible] = useState(false);

  const handleCloseNoteComponent = () => {
    // Set isNoteComponentVisible to false to close the NoteComponent
    setNoteComponentVisible(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex">
        <Sidebar setNoteComponentVisible={setNoteComponentVisible} />
        <div className="ml-4"> {/* Adjust the margin to your preference */}
          <h1 className="text-blue-500 text-xl mb-4">Where's Religion?</h1>
          <SearchBar />
          <NoteComponent isNoteComponentVisible={isNoteComponentVisible} onClose={handleCloseNoteComponent} />
        </div>
      </div>
    </main>
  );
}

