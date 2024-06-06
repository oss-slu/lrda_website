// pages/signup.js
'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import RegisterButton from '../../components/register_button';
import { toast } from 'sonner';
import { auth } from '../../config'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { validateEmail, validatePassword } from '../../utils/validation';
import { User } from '../../models/user_class';
import ApiService from '../../utils/api_service';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [institution, setInstitution] = useState('');

  const handleSignup = async () => {
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user data in the API
      const userData = {
        "@id": user.uid,
        name: `${firstName} ${lastName}`,
        roles: {
          administrator: false,
          contributor: true,
        },
      };
      await ApiService.createUserData(userData);

      toast.success("Signup successful!");

      // Set the user as logged in
      const userInstance = User.getInstance();
      userInstance.login(email, password);

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
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Confirm Password"
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
