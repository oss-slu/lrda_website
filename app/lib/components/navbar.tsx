"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "../models/user_class";
import ApiService from "../utils/api_service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const user = User.getInstance();

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasProfileData, setHasProfileData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pathname = usePathname();

  const getActiveClass = (href: string) => {
    if (href === "/" && pathname === "/") return "text-blue-500";
    if (href !== "/" && pathname && pathname.startsWith(href)) return "text-blue-500";
    return "text-blue-300 hover:text-blue-500 transition";
  };

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
    const init = async () => {
      try {
        setIsLoading(true);
        
        // 1) Pre‑login from cache
        const firebaseName = await user.getName();
        setName(firebaseName);
        if (firebaseName) {
          const token = localStorage.getItem(firebaseName);
          if (token) await user.login(firebaseName, token);
        }
  
        // 2) Fetch your app's user record
        const userId = await user.getId();
        if (!userId) {
          // No user ID means not authenticated
          setHasProfileData(false);
          setIsInstructor(false);
          setIsStudent(false);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
  
        try {
          const userData = await ApiService.fetchUserData(userId);
          // User has profile data
          setHasProfileData(true);
          
          // default to false if userData is null or undefined
          const instructorFlag = Boolean(userData?.isInstructor);
          setIsInstructor(instructorFlag);
    
          // 3) Fetch Firebase roles for student check
          try {
            const roles = await user.getRoles();
            const studentRole = !!roles?.contributor && !roles?.administrator;
            const adminRole = !!roles?.administrator;
            // only a student if studentRole AND not an instructor
            setIsStudent(studentRole && !instructorFlag);
            setIsAdmin(adminRole);
          } catch (rolesError) {
            console.warn('Could not fetch roles, assuming admin privileges:', rolesError);
            // If we can't get roles, assume admin privileges for users with profile data
            setIsAdmin(true);
            setIsStudent(false);
          }
        } catch (profileError) {
          // User exists in Firebase Auth but has no profile data
          console.log('🔍 Navbar Debug - User has authentication but no profile data:', profileError);
          setHasProfileData(false);
          setIsInstructor(false);
          setIsStudent(false);
          // Users with only authentication can apply for instructor
          setIsAdmin(true);
        }

      } catch (err) {
        console.warn("Navbar init failed:", err);
        // Reset all states on error
        setHasProfileData(false);
        setIsInstructor(false);
        setIsStudent(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);
  
  const showDropdown = isStudent || isInstructor;


  
  // Don't render the instructor link while loading to prevent flickering
  if (isLoading) {
    return (
      <nav className="bg-gray-900 w-full h-[10vh] flex items-center px-4 sm:px-6 text-white overflow-visible">
        <div className="flex items-center space-x-2 sm:space-x-6">
          <Link href="/" className={cn("text-lg sm:text-2xl font-bold ", getActiveClass("/"))}>
            Home
          </Link>
          <Link href="/lib/pages/map" className={cn("text-lg sm:text-2xl font-bold ", getActiveClass("/lib/pages/map"))}>
            Map
          </Link>
          <Link href="/lib/pages/aboutPage" className={cn("text-lg sm:text-2xl font-bold ", getActiveClass("/lib/pages/aboutPage"))}>
            About
          </Link>
          <Link href="/lib/pages/ResourcesPage" className={cn("text-lg sm:text-2xl font-bold ", getActiveClass("/lib/pages/ResourcesPage"))}>
            Resources
          </Link>
          <Link href="/lib/pages/StoriesPage" className={cn("text-lg sm:text-2xl font-bold ", getActiveClass("/lib/pages/StoriesPage"))}>
            Stories
          </Link>
        </div>
        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <span className="text-sm sm:text-lg font-semibold">Loading...</span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gray-900 w-full h-[10vh] flex items-center px-4 sm:px-6 text-white overflow-visible relative">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden p-2 text-blue-300 hover:text-blue-500 transition"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex items-center space-x-6">
        <Link href="/" className={cn("text-2xl font-bold", getActiveClass("/"))}>
          Home
        </Link>

        {name && (
          <Link
            href="/lib/pages/notes"
            id="navbar-create-note"
            className={cn("text-2xl font-bold", getActiveClass("/lib/pages/notes"))}
          >
            Notes
          </Link>
        )}

        <Link href="/lib/pages/map" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
          Map
        </Link>

        <Link href="/lib/pages/aboutPage" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
          About
        </Link>

        <Link href="/lib/pages/ResourcesPage" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
          Resources
        </Link>

        {showDropdown ? (
          <div className="relative group">
            <span className="cursor-pointer text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
              Stories
            </span>
            <div className="absolute left-0 mt-2 w-48 bg-white text-black rounded shadow-lg opacity-0 group-hover:opacity-100 transform scale-95 group-hover:scale-100 transition-all z-50">
              <Link href="/lib/pages/StoriesPage" className="block px-4 py-2 hover:bg-gray-200">
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
          <Link href="/lib/pages/StoriesPage" className="text-2xl font-bold text-blue-300 hover:text-blue-500 transition">
            Stories
          </Link>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-800 lg:hidden z-50 border-t border-gray-700">
          <div className="flex flex-col space-y-1 p-4">
            <Link href="/" className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2">
              Home
            </Link>
            
            {name && (
              <Link
                href="/lib/pages/notes"
                className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2"
              >
                Notes
              </Link>
            )}

            <Link href="/lib/pages/map" className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2">
              Map
            </Link>

            <Link href="/lib/pages/aboutPage" className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2">
              About
            </Link>

            <Link href="/lib/pages/ResourcesPage" className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2">
              Resources
            </Link>

            <Link href="/lib/pages/StoriesPage" className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2">
              Global Stories
            </Link>

            {isInstructor && (
              <Link
                href="/lib/pages/InstructorDashBoard"
                className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2 pl-4"
              >
                Instructor Dashboard
              </Link>
            )}

            {isStudent && (
              <Link
                href="/lib/pages/StudentDashBoard"
                className="text-lg font-semibold text-blue-300 hover:text-blue-500 transition py-2 pl-4"
              >
                Student Dashboard
              </Link>
            )}
          </div>
        </div>
      )}

      {/* User Actions */}
      <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
        {name ? (
          <>
            <span
              className="text-sm sm:text-lg font-semibold truncate max-w-[100px] sm:max-w-[150px] hover:underline cursor-pointer"
              title={name}
            >
              Hi, {name}!
            </span>
            <Button
              id="navbar-logout"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 sm:py-2 sm:px-4 text-sm sm:text-base border border-blue-700 rounded shadow"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <Button
            onClick={() => (window.location.href = "/lib/pages/loginPage")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-2 sm:py-2 sm:px-4 text-sm sm:text-base border border-blue-700 rounded shadow"
          >
            Login
          </Button>
        )}
      </div>
    </nav>
  );
}
