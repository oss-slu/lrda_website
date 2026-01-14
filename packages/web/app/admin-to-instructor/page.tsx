'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  submitInstructorApplication,
  canApplyForInstructor,
  AdminUser,
  AuthOnlyUser,
  getInstructorFieldRequirements,
} from '../lib/utils/adminToInstructor';

export default function AdminToInstructorApplication() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [adminData, setAdminData] = useState<AdminUser | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    name: '',
    email: '',
  });

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not initialized');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      if (currentUser) {
        setUser(currentUser);
        // Pre-fill form with Firebase Auth data for new users
        setFormData(prev => ({
          ...prev,
          name: currentUser.displayName || '',
          email: currentUser.email || '',
        }));
        await fetchAdminData(currentUser.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAdminData = async (uid: string) => {
    try {
      const eligibility = await canApplyForInstructor(uid);

      if (eligibility.canApply) {
        if (eligibility.isNewUser) {
          // User has authentication but no profile data
          setIsNewUser(true);
          setAdminData(null);
        } else if (eligibility.currentData) {
          // Existing admin user
          setIsNewUser(false);
          setAdminData(eligibility.currentData);
          setFormData(prev => ({
            ...prev,
            name: eligibility.currentData!.name,
            email: eligibility.currentData!.email,
          }));
        }
      } else {
        alert(eligibility.reason || 'Only administrators can apply to become instructors.');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      alert('Error loading user data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate required fields for new users
    if (isNewUser && (!formData.name.trim() || !formData.email.trim())) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (isNewUser) {
        // Submit application for new user with authentication only
        const userData: AuthOnlyUser = {
          uid: user.uid,
          email: formData.email,
          name: formData.name,
        };
        await submitInstructorApplication(user.uid, formData.description, userData);
      } else {
        // Submit application for existing admin user
        await submitInstructorApplication(user.uid, formData.description);
      }

      alert(
        'Application submitted successfully! Your application is now pending administrator approval.',
      );
      router.push('/');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      console.error('Error details:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'No code',
        stack: error?.stack || 'No stack',
      });
      alert(
        `Error submitting application: ${error?.message || 'Unknown error'}. Please try again.`,
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

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-xl'>Loading...</div>
      </div>
    );
  }

  if (!user) {
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
            <h1 className='mb-2 text-3xl font-bold text-gray-900'>
              {isNewUser ? 'Complete Your Instructor Profile' : 'Apply to Become an Instructor'}
            </h1>
            <p className='text-gray-600'>
              {isNewUser ?
                'You have authentication but need to complete your profile to become an instructor.'
              : 'Complete your instructor application using your existing admin information.'}
            </p>
          </div>

          {/* User Information Section */}
          {
            isNewUser ?
              // New user form - collect basic info
              <div className='mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4'>
                <h3 className='mb-3 text-lg font-semibold text-blue-900'>Complete Your Profile</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label htmlFor='name' className='mb-1 block text-sm font-medium text-blue-700'>
                      Full Name *
                    </label>
                    <input
                      type='text'
                      id='name'
                      name='name'
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter your full name'
                    />
                  </div>
                  <div>
                    <label htmlFor='email' className='mb-1 block text-sm font-medium text-blue-700'>
                      Email *
                    </label>
                    <input
                      type='email'
                      id='email'
                      name='email'
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className='w-full rounded-md border border-blue-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Enter your email'
                    />
                  </div>
                </div>
              </div>
              // Existing admin information display
            : <div className='mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4'>
                <h3 className='mb-3 text-lg font-semibold text-gray-900'>Your Admin Information</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Name</label>
                    <p className='text-gray-900'>{adminData?.name}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Email</label>
                    <p className='text-gray-900'>{adminData?.email}</p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Admin Since</label>
                    <p className='text-gray-900'>
                      {adminData?.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>Current Roles</label>
                    <p className='text-gray-900'>
                      {Object.entries(adminData?.roles || {})
                        .filter(([_, value]) => value)
                        .map(([key, _]) => key.charAt(0).toUpperCase() + key.slice(1))
                        .join(', ')}
                    </p>
                  </div>
                </div>
              </div>

          }

          {/* Field Requirements Information */}
          <div className='mb-6 rounded-lg border border-gray-300 bg-gray-50 p-4'>
            <h3 className='mb-3 text-lg font-semibold text-gray-900'>
              What You'll Gain as an Instructor
            </h3>
            <div className='space-y-3'>
              <div>
                <h4 className='font-medium text-gray-800'>New Fields to Complete:</h4>
                <ul className='ml-2 list-inside list-disc text-sm text-gray-700'>
                  {getInstructorFieldRequirements().requiredFields.map(field => (
                    <li key={field} className='capitalize'>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className='font-medium text-gray-800'>
                  {isNewUser ?
                    'Your Profile Data Will Be Created:'
                  : 'Your Admin Data Will Be Preserved:'}
                </h4>
                <ul className='ml-2 list-inside list-disc text-sm text-gray-700'>
                  {getInstructorFieldRequirements().preservedFields.map(field => (
                    <li key={field} className='capitalize'>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
                      {isNewUser ?
                        <>
                          <li>Your profile will be created with administrator privileges</li>
                          <li>You will retain your administrator privileges</li>
                        </>
                      : <li>You will retain your administrator privileges</li>}
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
