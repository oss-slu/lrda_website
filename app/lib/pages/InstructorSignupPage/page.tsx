"use client";
import React, { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Timestamp, doc, setDoc } from "firebase/firestore";

const InstructorSignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0); // Password strength indicator

  const validateEduEmail = (email) => {
    const eduRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+\.edu$/;
    return eduRegex.test(email);
  };

  const passwordValidationFeedback = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*]/.test(password),
    number: /\d/.test(password),
  };

  const calculatePasswordStrength = () => {
    const checks = Object.values(passwordValidationFeedback).filter(Boolean);
    return (checks.length / Object.keys(passwordValidationFeedback).length) * 100;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength());
  };

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName || !institution) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (!validateEduEmail(email)) {
      toast.error("Please use a valid .edu email address.");
      return;
    }

    if (!passwordValidationFeedback.length || !passwordValidationFeedback.uppercase || 
        !passwordValidationFeedback.special || !passwordValidationFeedback.number) {
      toast.error("Password does not meet the required criteria.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const fullName = `${firstName} ${lastName}`;

      const userData = {
        uid: user.uid,
        email,
        name: fullName,
        institution,
        isAdmin: false, // User is not an admin until approved
        requiresAdminApproval: true, // Marks user for admin approval
        createdAt: Timestamp.now(),
      };

      await setDoc(doc(db, "users", user.uid), userData);

      toast.success(
        "Your application has been submitted for approval. Please wait for admin approval."
      );

      // Reset the form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setInstitution("");
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error(`Signup failed: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-[#F4DFCD] min-h-screen">
      <div className="flex items-center justify-center">
        <Image
          src="/splash.png"
          alt="Background Image"
          width="2080"
          height="300"
        />
      </div>
      <div className="absolute inset-10 flex flex-col items-center justify-center">
        <div className="w-full md:w-1/2 bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-black-500 font-bold mb-20 text-center text-3xl">
            Admin Sign Up
          </h1>
          <h2 className="text-black-300 font-bold mb-10 text-center text-1xl">
            For Admins, Moderators, and Editors
          </h2>
          <div className="mb-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              name="institution"
              placeholder="Institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <div className="text-sm mt-2">
              <p>
                {passwordValidationFeedback.length ? "✔" : "✖"} At least 8 characters
              </p>
              <p>
                {passwordValidationFeedback.uppercase ? "✔" : "✖"} At least 1 uppercase letter
              </p>
              <p>
                {passwordValidationFeedback.special ? "✔" : "✖"} At least 1 special character
              </p>
              <p>
                {passwordValidationFeedback.number ? "✔" : "✖"} At least 1 number
              </p>
            </div>
            <div className="w-full bg-gray-300 h-2 rounded-lg mt-3">
              <div
                className={`h-full ${
                  passwordStrength < 50
                    ? "bg-red-500"
                    : passwordStrength < 80
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
          <div className="mb-4">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            onClick={handleSignup}
            className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorSignupPage;
