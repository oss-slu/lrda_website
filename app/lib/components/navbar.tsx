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

      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
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
          if (item) {
            await user.login(userName, item);
          }
        }
      } catch (error) {
        console.log("No user cached or login failed");
      }
    };

    fetchName();
  }, []);

  const linkClass = (href: string) =>
    cn(
      "text-2xl font-bold transition duration-300 ease-in-out mr-4",
      pathname === href ? "text-blue-500" : "text-blue-300 hover:text-blue-500"
    );

  return (
    <nav className="bg-gray-900 w-full h-[10vh] flex flex-row justify-between items-center px-6 py-3 text-white">
      <div className="flex w-full justify-start">
        <Link legacyBehavior href="/" passHref>
          <a className={linkClass("/")}>
            Home
          </a>
        </Link>

        {name ? (
          <Link legacyBehavior href="/lib/pages/notes" passHref>
            <a id="navbar-create-note"className={linkClass("/lib/pages/notes")}>
              Notes
            </a>
          </Link>
        ) : null}

        <Link legacyBehavior href="/lib/pages/map" passHref>
          <a className={linkClass("/lib/pages/map")}>
            Map
          </a>
        </Link>

        <Link legacyBehavior href="/lib/pages/aboutPage" passHref>
          <a className={linkClass("/lib/pages/aboutPage")}>
            About
          </a>
        </Link>
      </div>
      

      <div className="">
        {name ? (
          <div className="flex items-center gap-6 w-full">
            <span
              className="text-lg font-semibold min-w-max truncate max-w-[150px] hover:underline cursor-pointer"
              title={name}
            >
              Hi, {name}!
            </span>
            <Button
              id = "navbar-logout" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        ) : (
          <>
            <Button
              onClick={() => (window.location.href = "/lib/pages/loginPage")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
            >
              Login
            </Button>
            {/* <Button
              onClick={() => (window.location.href = "/lib/pages/signupPage")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 border border-blue-700 rounded shadow"
            >
              Sign Up
            </Button> */}
          </>
        )}
      </div>
    </nav>
  );
}