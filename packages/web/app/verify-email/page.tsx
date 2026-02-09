'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormItem, FormLabel } from '@/components/ui/form';

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    // Check if email is provided
    if (!email) {
      toast.error('No email provided');
    }
  }, [email]);

  const handleVerification = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);

    try {
      // In development, the verification link is logged to console
      // For now, show a message
      toast.info('In development mode, check the terminal for the verification link');
      
      // Redirect to home after a short delay to show the message
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsLoading(true);

    try {
      // The resend link functionality will be added when email service is configured
      toast.info('Resend email functionality coming soon');
    } catch (error) {
      console.error('Resend error:', error);
      toast.error('Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4'>
      {/* Verification Card */}
      <Card className='w-full max-w-md bg-white shadow-lg'>
        <div className='p-8'>
          <h1 className='mb-6 text-center text-2xl font-bold text-gray-800'>Verify Your Email</h1>

          <div className='mb-6 text-center'>
            <p className='text-gray-600 mb-2'>We've sent a verification link to:</p>
            <p className='font-semibold text-gray-800'>{email}</p>
          </div>

          <FormItem className='mb-6'>
            <FormLabel className='text-gray-700'>Verification Code (if received by email)</FormLabel>
            <Input
              type='text'
              placeholder='Enter verification code'
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              className='border-gray-300 mt-2'
              disabled={isLoading}
            />
          </FormItem>

          <div className='space-y-3'>
            <Button
              onClick={handleVerification}
              disabled={isLoading}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={isLoading}
              variant='outline'
              className='w-full border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Resend Verification Email
            </Button>
          </div>

          <div className='mt-6 text-center text-sm text-gray-600'>
            <p>Check your email for a verification link or code.</p>
            <p className='mt-2'>In development mode, check the terminal for the link.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
