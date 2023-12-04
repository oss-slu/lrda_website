"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { User } from '../models/user_class';
import { Button } from '@/components/ui/button';
import NoteListView from './note_listview';

interface SidebarProps {
  setNoteComponentVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setToolPageVisible: React.Dispatch<React.SetStateAction<boolean>>;
  // Add a prop for toolPageVisible
  toolPageVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ setNoteComponentVisible, setToolPageVisible, toolPageVisible }) => {
  const handleAddNoteClick = () => {
    setNoteComponentVisible(true);
    setToolPageVisible(true);
  };

  return (
    <div className="absolute top-0 left-0 h-screen w-64 bg-gray-200 p-4 overflow-y-auto flex flex-col">
      <div>
        <NoteListView />
      </div>
      {/* Use the handleAddNoteClick function for the onClick event */}
      <Button data-testid="add-note-button" onClick={handleAddNoteClick} className="w-full">
        Add Note
      </Button>
    </div>
  );
};

export default Sidebar;