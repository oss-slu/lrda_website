'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "../models/user_class";

const user = User.getInstance();

const Sidebar = () => {
  return (
    <div className="fixed top-16 left-0 bottom-0 w-64 bg-gray-200 p-4 overflow-y-auto">
      <div className="mt-2 p-2 text-white bg-blue-500 hover:bg-blue-600 rounded">
        <Link href="/add-note">Add Note</Link>
      </div>
    </div>
  );
};

export default Sidebar;
