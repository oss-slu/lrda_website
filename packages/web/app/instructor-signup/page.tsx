'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/stores/authStore';
import { updateProfile } from '../lib/services';

const InstructorSignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [emailError, setEmailError] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useAuthStore();

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
    if (password.length === 0) return 0;
    const checks = Object.values(passwordValidationFeedback).filter(Boolean);
    return (checks.length / Object.keys(passwordValidationFeedback).length) * 100;
  };

  const handlePasswordChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleEmailChange = (e: { target: { value: any } }) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError(false);

    if (typingTimeout) clearTimeout(typingTimeout);

    setTypingTimeout(
      setTimeout(() => {
        const isValid = validateEmail(value);
        setEmailError(!isValid);
      }, 500),
    );
  };

  const handleSignup = async () => {
    if (!email || !password || !firstName || !lastName || !confirmPassword || !description.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Please use a valid email address.');
      return;
    }

    if (
      !passwordValidationFeedback.length ||
      !passwordValidationFeedback.uppercase ||
      !passwordValidationFeedback.special ||
      !passwordValidationFeedback.number
    ) {
      toast.error('Password does not meet the required criteria.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description of why you want to become an Instructor.');
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

      // Update user profile to set as instructor with description
      try {
        await updateProfile({
          isInstructor: true,
          pendingInstructorDescription: description,
        });
      } catch (profileError) {
        console.error('Failed to set instructor profile:', profileError);
        toast.warning(
          'Account created but instructor status may not be set. Please contact support.',
        );
      }

      toast.success('Instructor account created successfully!');

      // Redirect to map page
      router.push('/map');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(
        `Signup failed: ${error instanceof Error ? error.message : 'An unexpected error occurred.'}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-[#F4DFCD]'>
      <div className='flex items-center justify-center'>
        <Image src='/splash.png' alt='Background Image' width='2080' height='300' />
      </div>
      <div className='absolute inset-10 flex flex-col items-center justify-center'>
        <div
          className='relative w-full rounded-lg bg-white p-8 shadow-lg md:w-1/2'
          style={{ minHeight: '50px' }}
        >
          <h1 className='text-black-500 mb-10 text-center text-3xl font-bold'>
            Instructor Sign Up
          </h1>
          <h2 className='text-black-300 mb-10 text-center text-xl font-semibold'>
            For managing, editing, and evaluating users within your group.
          </h2>
          <div className='mb-4'>
            <input
              type='text'
              name='firstName'
              placeholder='First Name'
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <div className='mb-4'>
            <input
              type='text'
              name='lastName'
              placeholder='Last Name'
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <div className='relative mb-4'>
            <input
              type='text'
              name='email'
              placeholder='Email'
              value={email}
              onChange={handleEmailChange}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
            {emailError && (
              <p className='mt-1 text-sm text-red-500'>Please use a valid email address.</p>
            )}
          </div>
          <div className='relative mb-4'>
            <input
              type={isPasswordVisible ? 'text' : 'password'}
              name='password'
              placeholder='Password'
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
            <button
              type='button'
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
              className='absolute right-4 top-3 text-gray-500'
            >
              {isPasswordVisible ? 'Hide' : 'Show'}
            </button>
            {isPasswordFocused && (
              <>
                <div className='mt-2 text-sm'>
                  <p>{passwordValidationFeedback.length ? '+' : '-'} At least 8 characters</p>
                  <p>
                    {passwordValidationFeedback.uppercase ? '+' : '-'} At least 1 uppercase letter
                  </p>
                  <p>
                    {passwordValidationFeedback.special ? '+' : '-'} At least 1 special character
                  </p>
                  <p>{passwordValidationFeedback.number ? '+' : '-'} At least 1 number</p>
                </div>
                <div className='mt-3 h-2 w-full rounded-lg bg-gray-300'>
                  <div
                    className={`h-full ${
                      passwordStrength < 50 ? 'bg-red-500'
                      : passwordStrength < 80 ? 'bg-yellow-500'
                      : 'bg-green-500'
                    }`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
                <p className='mt-2 text-center font-semibold'>
                  {passwordStrength < 50 ?
                    'Weak'
                  : passwordStrength < 80 ?
                    'Moderate'
                  : 'Strong'}
                </p>
              </>
            )}
          </div>
          <div className='relative mb-4'>
            <input
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              name='confirmPassword'
              placeholder='Confirm Password'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
            <button
              type='button'
              onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
              className='absolute right-4 top-3 text-gray-500'
            >
              {isConfirmPasswordVisible ? 'Hide' : 'Show'}
            </button>
            {confirmPassword && password !== confirmPassword && (
              <p className='mt-1 text-sm text-red-500'>
                Password and Confirm Password do not match.
              </p>
            )}
          </div>
          <div className='mb-4'>
            <label className='mb-2 block font-medium text-gray-700'>
              Why do you want to become an Instructor? *
            </label>
            <textarea
              placeholder='Describe your teaching experience, expertise, and motivation for becoming an Instructor...'
              value={description}
              onChange={e => setDescription(e.target.value)}
              className='w-full resize-none rounded-lg border border-gray-300 p-3'
              rows={4}
              required
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={isLoading}
            className='w-full rounded-lg bg-blue-500 p-3 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isLoading ? 'Creating Account...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorSignupPage;
