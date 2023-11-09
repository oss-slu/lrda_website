'use client'
import { useState, useEffect } from "react";
import SearchBar from "./lib/components/search_bar";
import Sidebar from "./lib/components/side_bar";
import NoteComponent from "./lib/components/note_component";
import Link from "next/link";
import { User } from "./lib/models/user_class";

const user = User.getInstance();

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="">
        <Sidebar />
        <NoteComponent />
      </div>
    </main>
  );
}
