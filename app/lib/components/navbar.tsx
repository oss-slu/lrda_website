"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";

const user = User.getInstance();

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  const handleLogout = async () => {
    try {
      await user.logout();
      if (name) localStorage.removeItem(name);
      if (typeof window !== "undefined") window.location.href = "/";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userName = await user.getName();
        setName(userName);
        const roles = await User.getInstance().getRoles();
        setIsInstructor(!!roles?.administrator);
        setIsStudent(!!roles?.contributor && !roles?.administrator);

        if (userName) {
          const token = localStorage.getItem(userName);
          if (token) await user.login(userName, token);
        }
      } catch {
        console.log("No user cached or login failed");
      }
    };
    fetchUser();
  }, []);

  const showDropdown = isStudent || isInstructor;

  return (
    <nav className="bg-gray-900 w-full h-[10vh] flex items-center px-6 py-3 text-white overflow-visible">
      <div className="flex items-center space-x-6">
        <Link href="/" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
          Home
        </Link>

        {name && (
          <Link
            href="/lib/pages/notes"
            id="navbar-create-note"
            className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition"
          >
            Notes
          </Link>
        )}

        <Link href="/lib/pages/map" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
          Map
        </Link>

        <Link
          href="/lib/pages/aboutPage"
          className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition"
        >
          About
        </Link>

        {/* Stories: dropdown for student/instructor, link otherwise */}
        {showDropdown ? (
          <div className="relative group">
            <span className="cursor-pointer text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
              Stories
            </span>
            <div className="absolute left-0 mt-2 w-48 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all z-50">
              <Link
                href="/lib/pages/StoriesPage"
                className="block px-4 py-2 hover:bg-gray-200"
              >
                Global Stories
              </Link>
              {isInstructor && (
                <Link
                  href="/lib/pages/InstructorDashBoard"
                  className="block px-4 py-2 hover:bg-gray-200"
                >
                  Instructor Dashboard
                </Link>
              )}
              {isStudent && (
                <Link
                  href="/lib/pages/StudentDashBoard"
                  className="block px-4 py-2 hover:bg-gray-200"
                >
                  Student Dashboard
                </Link>
              )}
            </div>
          </div>
        ) : (
          <Link
            href="/lib/pages/StoriesPage"
            className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition"
          >
            Stories
          </Link>
        )}
      </div>

      <div className="ml-auto flex items-center space-x-4">
        {name ? (
          <>
            <span
              className="text-lg font-semibold truncate max-w-[150px] hover:underline cursor-pointer"
              title={name}
            >
              Hi, {name}!
            </span>
            <Button
              id="navbar-logout"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            onClick={() => (window.location.href = "/lib/pages/loginPage")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
          >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}
