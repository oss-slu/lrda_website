"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const user = User.getInstance();

export default function Navbar() {
  const [name, setName] = useState<string | null>(null);
  const pathname = usePathname();

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

  // Define nav items
  const navItems = [
    { href: "/", label: "Home" },
    { href: "/lib/pages/notes", label: "Notes", authRequired: true },
    { href: "/lib/pages/map", label: "Map" },
    { href: "/lib/pages/aboutPage", label: "About" },
  ];


  // Active link styling
  const linkClass = (href: string) =>
    cn(
      "text-2xl font-bold transition duration-300 ease-in-out mr-4",
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
              <Link
                key={item.href}
                href={item.href}
                className={linkClass(item.href)}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            )
        )}
      </div>

      {/* Right side buttons */}
      <div>
        {name ? (
          <div className="flex items-center gap-6">
            <span
              className="text-lg font-semibold min-w-max truncate max-w-[150px]"
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
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/lib/pages/loginPage")}
              className="whitespace-nowrap"
            >
              Login
            </Button>
            <Button
              variant="default"
              onClick={() => (window.location.href = "/lib/pages/signupPage")}
              className="whitespace-nowrap"
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
