'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  validateEmail,
  validatePassword,
  validateFirstName,
  validateLastName,
} from '../lib/utils/validation';
import { useAuthStore } from '../lib/stores/authStore';
import { fetchInstructors, assignInstructor } from '../lib/services';
import StrengthIndicator from '@/components/ui/strength-indicator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [workingUnderInstructor, setWorkingUnderInstructor] = useState('');
  const [instructors, setInstructors] = useState<{ value: string; label: string }[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useAuthStore();

  // Fetch instructors for the dropdown
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const instructorsList = await fetchInstructors();
        setInstructors(
          instructorsList.map(i => ({
            value: i.id,
            label: i.name || i.email || 'Unknown Instructor',
          })),
        );
      } catch (error) {
        console.error('Error fetching instructors:', error);
        toast.error('Failed to fetch instructors. Please try again.');
      }
    };

    if (workingUnderInstructor === 'yes') {
      loadInstructors();
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

    setIsLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`;

      // Create user via better-auth
      await signup({
        email,
        password,
        name: fullName,
      });

      // If working under an instructor, assign the instructor relationship
      if (workingUnderInstructor === 'yes' && selectedInstructor) {
        try {
          await assignInstructor(selectedInstructor.value);
        } catch (error) {
          console.error('Failed to assign instructor:', error);
          // Don't fail signup if instructor assignment fails
          toast.warning(
            'Account created but instructor assignment failed. Please contact support.',
          );
        }
      }

      toast.success('Account created successfully!');

      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(`Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
                value={selectedInstructor?.value ?? ''}
                onValueChange={value => {
                  const instructor = instructors.find(i => i.value === value);
                  setSelectedInstructor(instructor ?? null);
                }}
              >
                <SelectTrigger className='w-full rounded-lg border border-gray-300 bg-white'>
                  <SelectValue placeholder='Choose an Instructor' />
                </SelectTrigger>
                <SelectContent>
                  {instructors.map(instructor => (
                    <SelectItem key={instructor.value} value={instructor.value}>
                      {instructor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className='flex flex-col items-center justify-center sm:flex-row'>
            <button
              onClick={handleSignup}
              disabled={isLoading}
              className='w-full rounded-lg bg-blue-500 p-3 text-white disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
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
