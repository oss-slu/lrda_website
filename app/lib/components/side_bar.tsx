'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/router';
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import NoteListView from "./note_listview";

const user = User.getInstance();

const Sidebar = () => {
  const [name, setName] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem(name || "");
    user.logout();
    window.location.href = "/";
  };

  useEffect(() => {
    const fetchName = async () => {
      try {
        const userName = await user.getName();
        setName(userName);
        const item = userName ? localStorage.getItem(userName) : null;
        await user.login(userName || "", item || "");
      } catch (error) {
        console.log("No user cached");
      }
    };
  
    fetchName();
  }, []);
  
  // Wrap the content in a flex container
  return (
    <div className="fixed top-0 left-0 bottom-0 w-64 bg-gray-200 p-4 overflow-y-auto flex flex-col justify-between">
      <div>
      
        {name ? (
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold leading-normal">
              Hi, {name}!
            </span>
            <button
              className="text-blue-500 text-m leading-normal p-0"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <Link
              className="text-blue-500 text-xl mb-4"
              href="/lib/pages/loginPage"
            >
              Login
            </Link>
          </div>
        )}
        <div>
      {/* ... */}
      <NoteListView /> {/* This is where the NoteListView component is used */}
      {/* ... */}
    </div>
      </div>

      {/* Add Note button at the bottom */}
      <Button
        data-testid="add-note-button"
      >
        Add Note
      </Button>
    </div>
  );
};

export default Sidebar;
