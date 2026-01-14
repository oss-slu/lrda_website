'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/config/firebase';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');

  const handlePasswordReset = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!auth) {
      toast.error('Firebase auth is not initialized');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email.');
    }
  };

  return (
    <div className='flex flex-col items-center justify-center bg-[#F4DFCD]'>
      <div className='flex items-center justify-center'>
        <Image src='/splash.png' alt='Background Image' width='2080' height='300' />
      </div>
      <div className='absolute inset-10 flex flex-col items-center justify-center'>
        <div className='w-3/4 rounded-lg bg-white p-8 shadow-lg'>
          <h1 className='text-black-500 mb-20 text-center text-3xl font-bold'>Forgot Password</h1>
          <div className='mb-4'>
            <input
              type='email'
              placeholder='Enter your email...'
              value={email}
              onChange={e => setEmail(e.target.value)}
              className='w-full rounded-lg border border-gray-300 p-3'
            />
          </div>
          <button
            onClick={handlePasswordReset}
            className='w-full rounded-lg bg-blue-500 py-3 font-semibold text-white hover:bg-blue-600'
          >
            Send Reset Email
          </button>
          <div className='mt-4 text-center'>
            <Link href='/login' className='text-blue-500 hover:underline'>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
