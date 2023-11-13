"use client";
import Sidebar from "./lib/components/side_bar";
import NoteComponent from "./lib/components/note_component";
import { User } from "./lib/models/user_class";

const user = User.getInstance();

export default function Home() {
  return (
    <main className="relative flex h-screen flex-row p-24">
      <Sidebar />
      <div className="flex-1 ml-64">
        <NoteComponent />
      </div>
    </main>
  );
}