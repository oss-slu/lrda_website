'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../lib/stores/authStore';
import { updateProfile } from '../lib/services';

export default function AdminToInstructorApplication() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, profile, isAdmin, isInstructor } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to be initialized
    if (authLoading) return;

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    // Check eligibility
    if (isInstructor()) {
      setError('You are already an instructor.');
      setLoading(false);
      return;
    }

    if (profile?.pendingInstructorDescription) {
      setError('You already have a pending instructor application.');
      setLoading(false);
      return;
    }

    if (!isAdmin()) {
      setError('Only administrators can apply to become instructors through this page.');
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [authLoading, isLoggedIn, profile, isAdmin, isInstructor, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!formData.description.trim()) {
      alert('Please provide a description.');
      return;
    }

    setSubmitting(true);
    try {
      // Submit application by updating profile with pending description
      await updateProfile({
        pendingInstructorDescription: formData.description,
      });

      alert(
        'Application submitted successfully! Your application is now pending administrator approval.',
      );
      router.push('/');
    } catch (err) {
      console.error('Error submitting application:', err);
      alert(
        `Error submitting application: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading || authLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-xl'>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mb-4 text-xl text-red-600'>{error}</div>
          <button
            onClick={() => router.push('/')}
            className='rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700'
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-xl text-red-600'>Access denied. Please log in.</div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl'>
        <div className='rounded-lg bg-white p-8 shadow-lg'>
          <div className='mb-8'>
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>Apply to Become an Instructor</h1>
            <p className='text-gray-600'>
              Complete your instructor application using your existing admin information.
            </p>
          </div>

          {/* User Information Section */}
          <div className='mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4'>
            <h3 className='mb-3 text-lg font-semibold text-gray-900'>Your Information</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Name</label>
                <p className='text-gray-900'>{profile.name}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Email</label>
                <p className='text-gray-900'>{profile.email}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Role</label>
                <p className='capitalize text-gray-900'>{profile.role}</p>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700'>Member Since</label>
                <p className='text-gray-900'>{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* What You'll Gain Section */}
          <div className='mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4'>
            <h3 className='mb-3 text-lg font-semibold text-gray-900'>
              What You'll Gain as an Instructor
            </h3>
            <ul className='ml-2 list-inside list-disc text-sm text-gray-700'>
              <li>Ability to manage and mentor students</li>
              <li>Access to student notes for review</li>
              <li>Instructor badge on your profile</li>
            </ul>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label htmlFor='description' className='mb-2 block text-sm font-medium text-gray-700'>
                Instructor Description *
              </label>
              <textarea
                id='description'
                name='description'
                rows={4}
                required
                value={formData.description}
                onChange={handleInputChange}
                placeholder='Describe your teaching experience, expertise, and why you want to become an instructor...'
                className='w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <p className='mt-1 text-sm text-gray-500'>
                This description will be visible to students and other instructors.
              </p>
            </div>

            <div className='rounded-lg border border-gray-300 bg-gray-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <svg className='h-5 w-5 text-gray-400' viewBox='0 0 20 20' fill='currentColor'>
                    <path
                      fillRule='evenodd'
                      d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-gray-800'>Important Information</h3>
                  <div className='mt-2 text-sm text-gray-700'>
                    <ul className='list-disc space-y-1 pl-5'>
                      <li>You will retain your administrator privileges</li>
                      <li>Your application will be reviewed by an administrator</li>
                      <li>You will be notified once your application is approved or rejected</li>
                      <li>You can start teaching only after approval</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-between pt-6'>
              <button
                type='button'
                onClick={() => router.back()}
                className='rounded-md border border-gray-300 bg-white px-6 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
