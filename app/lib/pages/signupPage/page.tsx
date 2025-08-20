"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import RegisterButton from "../../components/register_button";
import { toast } from "sonner";
import { auth, db } from "../../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { validateEmail, validatePassword, validateFirstName, validateLastName } from "../../utils/validation";
import { User } from "../../models/user_class";
import ApiService from "../../utils/api_service";
import { Timestamp, doc, setDoc, collection, getDocs, query, where, arrayUnion } from "firebase/firestore";
import Link from "next/link";
import Select from "react-select"; // Import react-select

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState("");
  const [workingUnderInstructor, setWorkingUnderInstructor] = useState(""); // Tracks radio button state
  const [instructors, setInstructors] = useState<{ value: string; label: string }[]>([]); // List of instructors
  const [selectedInstructor, setSelectedInstructor] = useState<{ value: string; label: string } | null>(null); // Selected instructor from dropdown

  // Fetch instructors for the dropdown
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        console.log("Fetching instructors...");
  
        // Query the 'users' collection to get instructors
        const instructorsRef = collection(db, "users");
        const instructorsQuery = query(instructorsRef, where("isInstructor", "==", true));
        const querySnapshot = await getDocs(instructorsQuery);
  
        // Map the results into the format required for react-select
        const instructorsList = querySnapshot.docs.map((doc) => ({
          value: doc.id, // Store the instructor's user ID
          label: doc.data().name, // Display the instructor's name
        }));
  
        console.log("Instructors fetched:", instructorsList);
        setInstructors(instructorsList);
      } catch (error) {
        console.error("Error fetching instructors:", error);
        toast.error("Failed to fetch instructors. Please try again.");
      }
    };
  
    if (workingUnderInstructor === "yes") {
      fetchInstructors();
    }
  }, [workingUnderInstructor]);
  
  const handleSignup = async () => {
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;
  
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!validateFirstName(firstName)) return;
    if (!validateLastName(lastName)) return;

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
        isInstructor: false, // Default to false unless specified
        roles: workingUnderInstructor === "yes"
          ? { contributor: true } // Contributor if under an instructor
          : { administrator: true, contributor: true }, // Full roles for independent users
        createdAt: Timestamp.now(),
        ...(workingUnderInstructor === "yes" && selectedInstructor
          ? { parentInstructorId: selectedInstructor.value, instructorName: selectedInstructor.label } // Add instructor relationship
          : {}),
      };
  
      // Store the user data in Firestore under the "users" collection
      await setDoc(doc(db, "users", user.uid), userData);
  
      // If working under an instructor, add the student ID to the instructor's record
      if (workingUnderInstructor === "yes" && selectedInstructor) {
        const instructorRef = doc(db, "users", selectedInstructor.value);
  
        // Use arrayUnion to add the student ID to the instructor's students array
        await setDoc(
          instructorRef,
          { students: arrayUnion(user.uid) },
          { merge: true } // Ensure we're only updating the `students` array
        );
  
        console.log(`Added student (${user.uid}) to instructor (${selectedInstructor.value})`);
      }
  
      // Success feedback and reset form
      toast.success("Account created successfully!");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setInstitution("");
      setWorkingUnderInstructor("");
      setSelectedInstructor(null);
    } catch (err: unknown) {
      console.error("Signup failed:", err);
      const message =
        err instanceof Error ? err.message : String(err);
      toast.error(`Signup failed: ${message}`);
    }
  };
  
  

  return (
    <div className="flex flex-col items-center justify-center bg-[#F4DFCD]">
      <div className="flex items-center justify-center">
        <Image src="/splash.png" alt="Background Image" width="2080" height="300" />
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
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Will you be working with an instructor?
            </label>
            <div className="flex space-x-4">
              <label>
                <input
                  type="radio"
                  value="yes"
                  checked={workingUnderInstructor === "yes"}
                  onChange={(e) => setWorkingUnderInstructor(e.target.value)}
                  className="mr-2"
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  value="no"
                  checked={workingUnderInstructor === "no"}
                  onChange={(e) => setWorkingUnderInstructor(e.target.value)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>
          {workingUnderInstructor === "yes" && (
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Select an Instructor
              </label>
              <Select
                options={instructors}
                value={selectedInstructor}
                onChange={setSelectedInstructor}
                placeholder="Choose an Instructor"
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <button
              onClick={handleSignup}
              className="w-full bg-blue-500 text-white p-3 rounded-lg"
            >
              Sign Up
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-right">
              If you wish to sign-up an Instructor, please{" "}
              <Link href="/lib/pages/InstructorSignupPage" className="text-blue-500 underline">
                Register Here.
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
