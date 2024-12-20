"use client";
import React, { useState } from "react";
import Image from "next/image";
import RegisterButton from "../../components/register_button";
import { toast } from "sonner";
import { auth, db } from "../../config/firebase"; // Ensure you import Firestore as well
import { createUserWithEmailAndPassword } from "firebase/auth";
import { validateEmail, validatePassword } from "../../utils/validation";
import { User } from "../../models/user_class";
import ApiService from "../../utils/api_service";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import Link from "next/link"; // Import Link for routing

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState("");

  const handleSignup = async () => {
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Combine firstName and lastName for the name field
      const fullName = `${firstName} ${lastName}`;
  
      // Prepare user data for Firestore
      const userData = {
        uid: user.uid,
        email,
        name: fullName,
        institution,
        roles: {
          administrator: true,
          contributor: true,
        },
        createdAt: Timestamp.now(),
      };
  
      // Store the user data in Firestore under the "users" collection
      await setDoc(doc(db, "users", user.uid), userData);
  
      // Set the user as logged in
      const userInstance = User.getInstance();
      await userInstance.login(email, password);

      // Optional delay to ensure everything is set up
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect the user to the home page
      window.location.href = "/";
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
           User Sign Up
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
            <button
              onClick={handleSignup}
              className="w-full bg-blue-500 text-white p-3 rounded-lg"
            >
              Sign Up
            </button>
          </div>
         

        </div>
      </div>
    </div>
  );
};

export default SignupPage;
