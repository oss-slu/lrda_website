"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Timestamp, doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";

const InstructorSignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [description, setDescription] = useState(""); // New state for description
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const passwordValidationFeedback = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*]/.test(password),
    number: /\d/.test(password),
  };

  const calculatePasswordStrength = (password: string | any[]) => {
    if (password.length === 0) return 0; // Ensure strength is 0 for an empty password
    const checks = Object.values(passwordValidationFeedback).filter(Boolean);
    return (checks.length / Object.keys(passwordValidationFeedback).length) * 100;
  };

  const handlePasswordChange = (e: { target: { value: any; }; }) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleEmailChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(false); // Reset error state while typing
  
    // Clear any existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);
  
    // Set a timeout to validate the email after the user stops typing
    setTypingTimeout(
      setTimeout(() => {
        const isValid = validateEmail(value);
        setEmailError(!isValid);
      }, 500) // Delay of 500ms after user stops typing
    );
  };

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
  
    if (!validateEmail(email)) {
      toast.error("Please use a valid email address.");
      return;
    }
  
    if (
      !passwordValidationFeedback.length ||
      !passwordValidationFeedback.uppercase ||
      !passwordValidationFeedback.special ||
      !passwordValidationFeedback.number
    ) {
      toast.error("Password does not meet the required criteria.");
      return;
    }
  
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
  
    try {
      console.log("Starting user registration with Firebase Authentication...");
  
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User successfully registered:", user.uid);
  
      // Check if the user already exists in the "Instructors" collection
      const userDocRef = doc(db, "Instructors", email);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        console.log("User already exists. Creating new entry in AdditionalDetails...");
  
        // Existing user: Add to "AdditionalDetails" subcollection
        const newDbRef = collection(db, `Instructors/${email}/AdditionalDetails`);
        if (userDocSnap.exists()) {
          console.log("Instructor already exists, adding new entry to AdditionalDetails.");
          const newDbRef = collection(db, `Instructors/${email}/AdditionalDetails`);
          await addDoc(newDbRef, {
            email,
            name: `${firstName} ${lastName}`,
            description, // Add description to subcollection entry
            createdAt: Timestamp.now(),
          });
          toast.success("Additional details added to your Instructor account!");
        } else {
          console.log("Creating new Instructor document...");
          const userData = {
            email,
            name: `${firstName} ${lastName}`,
            description, // Include description in main document
            createdAt: Timestamp.now(),
            canAddUsers: true, // Ability to add multiple users under them
          };
          await setDoc(userDocRef, userData);
          toast.success("Instructor account created successfully!");
        }
        toast.success("New database entry created under your account!");
      } else {
        console.log("New user. Creating main Instructor document...");
  
        // New user: Add to "Instructors" collection
        const userData = {
          email,
          name: `${firstName} ${lastName}`,
          description, // Include description in main document
          canAddUsers: true, // Ability to add multiple users under them
          createdAt: Timestamp.now(),
        };
  
        await setDoc(userDocRef, userData);
        toast.success("Instructor account created successfully!");
      }
  
      // Reset form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setDescription("");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error during signup: ", error.message);
        toast.error(`Signup failed: ${error.message}`);
      } else {
        console.error("Unexpected error during signup: ", error);
        toast.error("Signup failed: An unexpected error occurred.");
      }
    }
  };
  
  

  return (
    <div className="flex flex-col items-center justify-center bg-[#F4DFCD] min-h-screen">
      <div className="flex items-center justify-center">
        <Image src="/splash.png" alt="Background Image" width="2080" height="300" />
      </div>
      <div className="absolute inset-10 flex flex-col items-center justify-center">
        <div
          className="w-full md:w-1/2 bg-white p-8 rounded-lg shadow-lg relative"
          style={{ minHeight: "50px" }} // Ensure minimum height to avoid upward push
        >
          <h1 className="text-black-500 font-bold mb-10 text-center text-3xl">
            Instructor Sign Up
          </h1>
          <h2 className="text-black-300 font-semibold mb-10 text-center text-xl">
            For managing, editing, and evaluating users within your group.
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
          <div className="mb-4 relative">
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">Please use a valid .edu email address.</p>
            )}
          </div>
          <div className="mb-4 relative">
            <input
              type={isPasswordVisible ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className="absolute right-4 top-3 text-gray-500"
            >
              {isPasswordVisible ? "👁️" : "👁️‍🗨️"}
            </button>
            {isPasswordFocused && (
              <>
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
                <p className="text-center mt-2 font-semibold">
                  {passwordStrength < 50
                    ? "Weak"
                    : passwordStrength < 80
                    ? "Moderate"
                    : "Strong"}
                </p>
              </>
            )}
          </div>
          <div className="mb-4 relative">
            <input
              type={isConfirmPasswordVisible ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              className="absolute right-4 top-3 text-gray-500"
            >
              {isConfirmPasswordVisible ? "👁️" : "👁️‍🗨️"}
            </button>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-red-500 text-sm mt-1">Password and Confirm Password do not match.</p>
            )}
          </div>
          <textarea
            placeholder="Why do you want to become an Instructor?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg resize-none"
            rows={4}
            required
          />

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
