"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNotesStore } from "../stores/notesStore";
import ApiService from "../utils/api_service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const user = User.getInstance();

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  const [isInstructor, setIsInstructor] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { viewMode, setViewMode } = useNotesStore();

  const handleLogout = async () => {
    try {
      await user.logout();
      localStorage.removeItem(name || "");
      if (typeof window !== "undefined") window.location.href = "/";
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const fetchName = async () => {
      try {
        const userName = await user.getName();
        setName(userName);
        if (userName) {
          const item = localStorage.getItem(userName);
          if (item) await user.login(userName, item);
        }
      } catch {
        console.log("No user cached or login failed");
      }
    };
    fetchName();
  }, []);

  // Check if user is instructor
  useEffect(() => {
    const checkInstructorStatus = async () => {
      if (!name) return;
      try {
        const roles = await user.getRoles();
        const userId = await user.getId();
        
        if (userId) {
          const userData = await ApiService.fetchUserData(userId);
          // Check if user is an instructor (has administrator role OR isInstructor flag)
          const isInstr = !!roles?.administrator || !!userData?.isInstructor;
          setIsInstructor(isInstr);
        }
      } catch (error) {
        console.error("Error checking instructor status:", error);
      }
    };
    checkInstructorStatus();
  }, [name]);

  // Define nav items
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/lib/pages/notes", label: "Notes", authRequired: true },
    { href: "/lib/pages/map", label: "Map" },
    { href: "/lib/pages/StoriesPage", label: "Stories" },
    { href: "/lib/pages/ResourcesPage", label: "Resources" },
  ];

  // Active link styling
  const linkClass = (href: string) =>
    cn(
      "text-xl font-bold transition duration-300 ease-in-out mr-6",

      href === "/"
        ? pathname === "/" // Home should only match exactly
          ? "text-blue-500"
          : "text-blue-300 hover:text-blue-500"
        : pathname.startsWith(href) // Others can use startsWith
        ? "text-blue-500"
        : "text-blue-300 hover:text-blue-500"
    );

  return (
    <nav className="bg-gray-900 w-full flex justify-between items-center px-6 py-4 text-white">
      {/* Left side links */}
      <div className="flex items-center">
        {navItems.map(
          (item) =>
            (!item.authRequired || name) && (
              item.href === "/lib/pages/notes" && isInstructor ? (
                <div key={item.href} className="mr-6">
                  <Select
                    value={viewMode}
                    onValueChange={(value) => {
                      setViewMode(value as "my" | "review");
                      router.push("/lib/pages/notes");
                    }}
                  >
                    <SelectTrigger 
                      className={cn(
                        "text-xl font-bold transition duration-300 ease-in-out border-none bg-transparent text-blue-300 hover:text-blue-500 focus:ring-0 focus:ring-offset-0 h-auto py-0 px-0 w-auto shadow-none",
                        pathname.startsWith(item.href) ? "text-blue-500" : ""
                      )}
                    >
                      <SelectValue>
                        <span className={cn(
                          pathname.startsWith(item.href) ? "text-blue-500" : "text-blue-300 hover:text-blue-500"
                        )}>
                          {item.label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="my">My Notes</SelectItem>
                      <SelectItem value="review">Students Notes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={linkClass(item.href)}
                  aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              )
            )
        )}
      </div>

      {/* Right side buttons */}
      <div>
        {name ? (
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold min-w-max truncate max-w-[150px]" title={name}>
              Hi, {name}!
            </span>
            <Button
              id="navbar-logout"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={() => (window.location.href = "/lib/pages/loginPage")} className="whitespace-nowrap">
              Login
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/lib/pages/signupPage")} className="whitespace-nowrap">
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
