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
    <nav className="bg-gray-900 w-full h-20 flex justify-between items-center px-6 py-3 text-white">
    <Link legacyBehavior href="/" passHref>
      <a className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition duration-300 ease-in-out">
        Where's Religion?
      </a>
    </Link >
    <div className="flex items-center gap-4">
      <SearchBar />
      {name ? (
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">Hi, {name}!</span>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      ) : (
          <Button 
          onClick={()=>window.location.href = "lib/pages/loginPage"}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow">
            Login
          </Button>
      )}
    </div>
  </nav>
  
  );
}
