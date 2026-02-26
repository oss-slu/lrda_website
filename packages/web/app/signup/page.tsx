'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '../lib/stores/authStore';
import { fetchInstructors } from '../lib/services';
import StrengthIndicator from '@/components/ui/strength-indicator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'none' | 'instructor' | 'student';
  instructorId?: string;
  instructorDescription?: string;
}

const SignupPage = () => {
  const [instructors, setInstructors] = useState<{ value: string; label: string }[]>([]);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuthStore();

  const form = useForm<SignupFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'none',
      instructorId: '',
      instructorDescription: '',
    },
  });

  const selectedRole = form.watch('role');

  // Fetch instructors when role changes to student
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

    if (selectedRole === 'student') {
      loadInstructors();
    }
  }, [selectedRole]);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[!@#$%^&*]/.test(password)) strength += 25;
    return strength;
  };

  const onSubmit = async (data: SignupFormData) => {
    // Validate password strength
    if (passwordRequirements.length > 0) {
      toast.error('Password must meet all requirements');
      return;
    }

    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate instructor selection for students
    if (data.role === 'student' && !data.instructorId) {
      toast.error('Please select an instructor');
      return;
    }

    // Validate instructor description
    if (data.role === 'instructor' && !data.instructorDescription?.trim()) {
      toast.error('Please provide a description of your teaching background');
      return;
    }

    setIsLoading(true);

    try {
      const fullName = `${data.firstName} ${data.lastName}`;

      // Create user via better-auth with role-specific fields set at creation time
      await signup({
        email: data.email,
        password: data.password,
        name: fullName,
        ...(data.role === 'instructor' && {
          pendingInstructorDescription: data.instructorDescription?.trim(),
        }),
        ...(data.role === 'student' && data.instructorId && { instructorId: data.instructorId }),
      });

      toast.success('Account created! Check your email to verify.');

      // Redirect to confirmation page showing email verification info
      // The verification link will be in their email with the token
      window.location.href = `/confirm?email=${encodeURIComponent(data.email)}`;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(`Signup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex min-h-full flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8'>
      {/* Signup Card */}
      <Card className='w-full max-w-md bg-white shadow-lg'>
        <div className='p-8'>
          <h1 className='mb-6 text-center text-2xl font-bold text-gray-800'>Sign Up</h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              {/* Name Fields */}
              <div className='grid grid-cols-2 gap-2'>
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-gray-700'>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='John'
                          {...field}
                          className='border-gray-300'
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-gray-700'>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Doe'
                          {...field}
                          className='border-gray-300'
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Field */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-700'>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='john@example.com'
                        {...field}
                        className='border-gray-300'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-700'>Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Enter password'
                        {...field}
                        className='border-gray-300'
                        disabled={isLoading}
                        onChange={e => {
                          field.onChange(e);
                          setPasswordStrength(calculatePasswordStrength(e.target.value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <StrengthIndicator
                        password={field.value}
                        onUnmet={unmetRequirements => setPasswordRequirements(unmetRequirements)}
                      />
                    )}
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-700'>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Confirm password'
                        {...field}
                        className='border-gray-300'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role Selection */}
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-700'>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className='border-gray-300'>
                          <SelectValue placeholder='Select your role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>None</SelectItem>
                        <SelectItem value='student'>Student</SelectItem>
                        <SelectItem value='instructor'>Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instructor Description (Instructor Only) */}
              {selectedRole === 'instructor' && (
                <FormField
                  control={form.control}
                  name='instructorDescription'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-gray-700'>
                        Describe Your Teaching Background
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Describe your teaching experience, expertise, and why you want to be an instructor...'
                          {...field}
                          className='min-h-[100px] border-gray-300'
                          disabled={isLoading}
                        />
                      </FormControl>
                      <p className='text-xs text-gray-500'>
                        Your application will be reviewed by an administrator.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Instructor Selection (Student Only) */}
              {selectedRole === 'student' && (
                <FormField
                  control={form.control}
                  name='instructorId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-gray-700'>Select Your Instructor</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className='border-gray-300'>
                            <SelectValue placeholder='Choose an instructor' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {instructors.map(instructor => (
                            <SelectItem key={instructor.value} value={instructor.value}>
                              {instructor.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Submit Button */}
              <Button
                type='submit'
                disabled={isLoading}
                className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </form>
          </Form>

          {/* Sign In Link */}
          <div className='mt-4 text-center text-sm'>
            <span className='text-gray-600'>Already have an account? </span>
            <Link
              href='/login'
              className='font-semibold text-blue-600 underline hover:text-blue-800'
            >
              Log In
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignupPage;
