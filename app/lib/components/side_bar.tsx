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
  

  return (
    <div className="fixed top-0 left-0 bottom-0 w-64 bg-gray-200 p-4 overflow-y-auto">
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
      <div className="mt-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded">
        <Link href="/add-note">Add Note</Link>
      </div>
    </div>
  );
};

export default Sidebar;
