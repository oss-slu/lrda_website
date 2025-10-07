"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import LoginButton from "../../components/login_button";
import Link from 'next/link';
// RegisterButton replaced by inline sign-up link per reviewer request
import { Input } from "@/components/ui/input";
import PasswordInput from "@/components/ui/password-input";
import { toast } from "sonner";

const Page = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const UserModule = await import("../../models/user_class");
      const user = UserModule.User.getInstance ? UserModule.User.getInstance() : (UserModule.User as any).getInstance();
      // Attempt login
      const status = await user.login(username, password);
      if (status === "success") {
        window.location.href = "/lib/pages/map";
      } else {
        // show error toast
        (await import('sonner')).toast.error("Login failed. Please check your credentials.");
      }
    } catch (err) {
      const msg = (err && (err as any).message) || String(err);
      (await import('sonner')).toast.error(`Login failed: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  

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
          <h1 className="text-black-500 font-bold mb-8 text-center text-3xl">
            Login
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="email-input" className="block text-base sm:text-lg font-semibold text-gray-700 mb-1 sm:mb-2">Email or Username</label>
              <Input
                id="email-input"
                name="username"
                type="text"
                autoComplete="username email"
                placeholder="you@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
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
            {/* Forgot password flow not implemented yet - hide link until available */}
            {false && (
              <button className="mb-2 text-sm text-blue-500 hover:underline" type="button">
                Forgot Password?
              </button>
            )}

            <div className="flex flex-col items-center justify-center mt-6 gap-4">
              <button
                type="submit"
                className={`${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} w-48 h-12 rounded-full flex justify-center items-center font-semibold text-base shadow-sm disabled:opacity-50 bg-[#0f1724] text-white`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Loading...' : 'Login'}
              </button>

              <div className="text-sm text-center">
                <span className="text-gray-700">Don't have an account? </span>
                <Link href="/lib/pages/signupPage" className="text-blue-600 hover:underline">Sign up</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
