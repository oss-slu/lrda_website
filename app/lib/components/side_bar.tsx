"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import NoteListView from "./note_listview";

interface SidebarProps {
  setNoteComponentVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const user = User.getInstance();

const Sidebar = () => {
  // Wrap the content in a flex container
  return (
    <div className="absolute top-0 left-0 h-screen w-64 bg-gray-200 p-4 overflow-y-auto flex flex-col">
      <div>
        <NoteListView />{" "}
      </div>
      <Button data-testid="add-note-button">Add Note</Button>
    </div>
  );
}

export default Sidebar;

