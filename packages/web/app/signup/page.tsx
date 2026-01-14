'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import RegisterButton from '../lib/components/register_button';
import { toast } from 'sonner';
import { auth, db } from '../lib/config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  validateEmail,
  validatePassword,
  validateFirstName,
  validateLastName,
} from '../lib/utils/validation';
import { useAuthStore } from '../lib/stores/authStore';
import {
  Timestamp,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import Link from 'next/link'; // Import Link for routing
import StrengthIndicator from '@/components/ui/strength-indicator';
import Select, { type SingleValue } from 'react-select'; // Import react-select

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [institution, setInstitution] = useState('');
  const [workingUnderInstructor, setWorkingUnderInstructor] = useState(''); // Tracks radio button state
  const [instructors, setInstructors] = useState<{ value: string; label: string }[]>([]); // List of instructors
  const [selectedInstructor, setSelectedInstructor] = useState<{
    value: string;
    label: string;
  } | null>(null); // Selected instructor from dropdown
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);

  // Fetch instructors for the dropdown
  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        console.log('Fetching instructors...');

        if (!db) {
          throw new Error('Firestore is not initialized');
        }

        // Query the 'users' collection to get instructors
        const instructorsRef = collection(db, 'users');
        const instructorsQuery = query(instructorsRef, where('isInstructor', '==', true));
        const querySnapshot = await getDocs(instructorsQuery);

        // Map the results into the format required for react-select
        const instructorsList = querySnapshot.docs.map(doc => ({
          value: doc.id, // Store the instructor's user ID
          label: doc.data().name || doc.data().email || 'Unknown Instructor', // Display the instructor's name
        }));

        console.log('Instructors fetched:', instructorsList);
        setInstructors(instructorsList);
      } catch (error) {
        console.error('Error fetching instructors:', error);
        toast.error('Failed to fetch instructors. Please try again.');
      }
    };

    if (workingUnderInstructor === 'yes') {
      fetchInstructors();
    }
  }, [workingUnderInstructor]);

  const handleSignup = async () => {
    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

    // Check if password meets all requirements
    if (passwordRequirements.length > 0) {
      toast.error(`Password must meet all requirements`);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!validateFirstName(firstName)) return;
    if (!validateLastName(lastName)) return;

    // Validate instructor selection if working under an instructor
    if (workingUnderInstructor === 'yes' && !selectedInstructor) {
      toast.error('Please select an instructor');
      return;
    }

    try {
      if (!auth) throw new Error('Firebase auth is not initialized');
      // Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Combine firstName and lastName for the name field
      const fullName = `${firstName} ${lastName}`;

      // Prepare user data for Firestore
      const userData: any = {
        uid: user.uid,
        email,
        name: fullName,
        institution,
        roles:
          workingUnderInstructor === 'yes' ?
            { contributor: true } // Contributor if under an instructor
          : { administrator: true, contributor: true }, // Full roles for independent users
        createdAt: Timestamp.now(),
        ...(workingUnderInstructor === 'yes' && selectedInstructor ?
          { parentInstructorId: selectedInstructor.value, instructorName: selectedInstructor.label } // Add instructor relationship
        : {}),
      };

      // Store the user data in Firestore under the "users" collection
      if (!db) throw new Error('Firestore is not initialized');
      await setDoc(doc(db, 'users', user.uid), userData);

      // If working under an instructor, update the instructor's students array
      if (workingUnderInstructor === 'yes' && selectedInstructor) {
        const instructorRef = doc(db, 'users', selectedInstructor.value);

        // Use arrayUnion to add the student ID to the instructor's students array
        await updateDoc(instructorRef, { students: arrayUnion(user.uid) });

        console.log(`Added student (${user.uid}) to instructor (${selectedInstructor.value})`);
      }

      // Set the user as logged in
      const { login } = useAuthStore.getState();
      await login(email, password);

      // Optional delay to ensure everything is set up
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect the user to the home page
      window.location.href = '/';
    } catch (error) {
      toast.error(`Signup failed: ${error}`);
    }
  };

  return (
    <div className='flex flex-col items-center justify-center bg-[#F4DFCD]'>
      <div className='flex items-center justify-center'>
        <Image src='/splash.png' alt='Background Image' width='2080' height='300' />
      </div>
      <div className='absolute inset-10 flex flex-col items-center justify-center'>
        <div className='w-3/4 rounded-lg bg-white p-8 shadow-lg'>
          <h1 className='text-black-500 mb-20 text-center text-3xl font-bold'>User Sign Up</h1>
          <div className='mb-4'>
            <input
              type='text'
              placeholder='First Name'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <div className='mb-4'>
            <input
              type='text'
              placeholder='Last Name'
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <div className='mb-4'>
            <input
              type='text'
              placeholder='Email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <div className='mb-4'>
            <input
              type='password'
              placeholder='Password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
            <StrengthIndicator
              password={password}
              onUnmet={unmetRequirements => setPasswordRequirements(unmetRequirements)}
            />
          </div>
          <div className='mb-4'>
            <input
              type='password'
              placeholder='Confirm Password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <div className='mb-4'>
            <label className='mb-2 block font-medium text-gray-700'>
              Will you be working under an Instructor?
            </label>
            <div className='flex space-x-4'>
              <label>
                <input
                  type='radio'
                  value='yes'
                  checked={workingUnderInstructor === 'yes'}
                  onChange={e => setWorkingUnderInstructor(e.target.value)}
                  className='mr-2'
                />
                Yes
              </label>
              <label>
                <input
                  type='radio'
                  value='no'
                  checked={workingUnderInstructor === 'no'}
                  onChange={e => setWorkingUnderInstructor(e.target.value)}
                  className='mr-2'
                />
                No
              </label>
            </div>
          </div>
          {workingUnderInstructor === 'yes' && (
            <div className='mb-4'>
              <label className='mb-2 block font-medium text-gray-700'>Select an Instructor</label>
              <Select
                options={instructors}
                value={selectedInstructor}
                onChange={(selected: SingleValue<{ value: string; label: string }>) =>
                  setSelectedInstructor(selected)
                }
                placeholder='Choose an Instructor'
                isClearable
              />
            </div>
          )}
          <div className='flex flex-col items-center justify-center sm:flex-row'>
            <button onClick={handleSignup} className='w-full rounded-lg bg-blue-500 p-3 text-white'>
              Sign Up
            </button>
          </div>
          <div className='mt-4 text-center'>
            <Link
              href='/instructor-signup'
              className='text-sm text-blue-600 underline hover:text-blue-800'
            >
              Want to sign up as an Instructor?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
