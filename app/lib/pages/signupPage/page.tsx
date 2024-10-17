"use client";
import React, { useState } from "react";
import { toast } from "sonner"; // For notifications
import { auth } from "../../config"; // Firebase auth config
import { createUserWithEmailAndPassword } from "firebase/auth"; // Firebase auth method

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false); // State for loading spinner

  // Optional: Type guard to check if error has a 'message' property
  function isErrorWithMessage(error: unknown): error is { message: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: string }).message === "string"
    );
  }

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true); // Show loading spinner

      // Step 1: Register user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Prepare user data (including Firebase UID)
      const userData = {
        uid: user.uid, // Firebase UID
        fullName: `${firstName} ${lastName}`, // Concatenate first and last name
        email: email, // Email used for Firebase
        password: password, // Password used for both Firebase and RERUM
      };

      // Step 3: Send the user data to the backend to trigger Selenium and create the user in RERUM
      const response = await fetch('/api/run-selenium', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
      } else {
        toast.error(`Error: ${result.message}`);
      }

      // Optional: Redirect user to homepage or success page after a delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      // Use the type guard to check if error has a 'message' property
      if (isErrorWithMessage(error)) {
        toast.error(`Signup failed: ${error.message}`);
      } else {
        // Fallback for unknown error types
        toast.error('Signup failed: An unknown error occurred');
      }
    } finally {
      setLoading(false); // Stop loading spinner
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-[#F4DFCD]">
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
            <button
              onClick={handleSignup}
              className="w-full bg-blue-500 text-white p-3 rounded-lg"
              disabled={loading}
            >
              {loading ? "Signing Up..." : "Sign Up"} {/* Loading indication */}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
