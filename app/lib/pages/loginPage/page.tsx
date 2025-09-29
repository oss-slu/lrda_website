"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import LoginButton from "../../components/login_button";
import RegisterButton from "../../components/register_button";
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/ui/password-input";
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
            <label htmlFor="email-input" className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Email or Username</label>
            <Input
              id="email-input"
              type="text"
              autoComplete="username email"
              placeholder="you@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <PasswordInput
              id="password-input"
              password={password}
              onPasswordChange={(v) => setPassword(v)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className="mb-2 text-sm text-blue-500 hover:underline">
            Forgot Password?
          </button>
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
