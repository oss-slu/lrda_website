"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginButton from "../lib/components/login_button";
import RegisterButton from "../lib/components/register_button";
import { toast } from "sonner";

const Page = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  

  return (
    <div className="flex flex-col items-center justify-center bg-[#F4DFCD]">
      <div className="flex items-center justify-center">
        <Image
          src="/splash.png"
          alt="Background Image"
          width="2080"
          height="300"
        />
      </div>{" "}
      <div className="absolute inset-10 flex flex-col items-center justify-center">
        <div className="w-3/4 bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-black-500 font-bold mb-20 text-center text-3xl">
            Login
          </h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Email..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <Link href="/forgot-password" className="mb-2 text-sm text-blue-500 hover:underline">
  Forgot Password?
</Link>

          <div className="flex flex-col sm:flex-row items-center justify-center">
            <LoginButton username={username} password={password}></LoginButton>
            <div className="w-10 h-1 sm:h-0 sm:w-5"></div>
            <RegisterButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
