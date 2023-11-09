'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "../models/user_class";
import { Button } from "@/components/ui/button";

const user = User.getInstance();

const Sidebar = () => {
  return (
    <div className="fixed top-16 left-0 bottom-0 w-64 bg-gray-200 p-4 overflow-y-auto">
        <Button className="mt-2 p-2 w-full text-white rounded">
          Add Note
        </Button>
    </div>
  );
};

export default Sidebar;
