'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import RegisterButton from '../../components/register_button';
import { toast } from 'sonner';
import { auth } from '../../config'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';

const SignupPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, username, password);
      toast.success("Signup successful!");
      // Optionally, redirect the user or perform other actions
    } catch (error) {
      toast.error(`Signup failed: ${error}`);
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
      </div>
      <div className="absolute inset-10 flex flex-col items-center justify-center">
        <div className="w-3/4 bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-black-500 font-bold mb-20 text-center text-3xl">
            Sign Up
          </h1>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username..."
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
          <div className="mb-4">
            <input
              type="password"
              placeholder="Confirm Password..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <button onClick={handleSignup} className="w-full bg-blue-500 text-white p-3 rounded-lg">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
