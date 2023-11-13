"use client";
import { useState, useEffect } from "react";
import SearchBar from "./lib/components/search_bar";
import Sidebar from "./lib/components/side_bar";
import NoteComponent from "./lib/components/note_component";
import Link from "next/link";
import Navbar from "./lib/components/navbar";
import { User } from "./lib/models/user_class";

const user = User.getInstance();

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
    <Navbar />
    <div className="flex flex-grow overflow-hidden">
      <Sidebar />
      <div className="flex-1">
        <NoteComponent />
      </div>
    </div>
  </div>

  );
}

