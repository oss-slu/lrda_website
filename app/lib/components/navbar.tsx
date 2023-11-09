"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "../models/user_class";
import SearchBar from "./search_bar";
import { Button } from "@/components/ui/button";

const user = User.getInstance();

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem(name || "");
    user.logout();
    // Use Next.js router instead of window.location for client-side navigation
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
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
    <nav className="bg-blue-500 w-full h-16 flex justify-between items-center p-4 text-white">
      <button
        className="text-xl px-4 py-2 rounded focus:outline-none"
        onClick={() => {
          window.location.href = "/";
        }}
      >
        Where's Religion?
      </button>
      <div className="flex items-center">
        <SearchBar />
      </div>
      <div>
        {name ? (
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold">Hi, {name}!</span>
            <Button
              className= "text-sm px-4 py-2 rounded"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => {window.location.href="/lib/pages/loginPage"}}
            className="px-4 py-2 rounded-md"
            >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}
