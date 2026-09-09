import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchInstructors } from '@/services/users.service';
import StrengthIndicator from '@/components/ui/strength-indicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
  role: 'researcher' | 'instructor' | 'student';
  instructorId?: string;
  instructorDescription?: string;
}

export const Route = createFileRoute('/_public/signup')({
  head: () => ({
    meta: [{ title: "Sign Up | Where's Religion?" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<{ value: string; label: string }[]>([]);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuthStore(useShallow(state => ({ signup: state.signup })));
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const form = useForm<SignupFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'researcher',
      instructorId: '',
      instructorDescription: '',
    },
  });

  const selectedRole = form.watch('role');
  const passwordValue = form.watch('password');

  const loadInstructors = useCallback(async (search?: string) => {
    try {
      const instructorsList = await fetchInstructors(search);
      setInstructors(
        instructorsList.map(i => ({
          value: i.id,
          label: i.name || 'Unknown Instructor',
        })),
      );
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error('Failed to fetch instructors. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (selectedRole === 'student') {
      loadInstructors();
    }
  }, [selectedRole, loadInstructors]);

  useEffect(() => {
    if (selectedRole !== 'student') return;
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadInstructors(instructorSearch || undefined);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [instructorSearch, selectedRole, loadInstructors]);

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
      navigate({ to: '/confirm', search: { email: data.email, sent: true } });
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
        <CardHeader>
          <div className='mb-2 flex justify-center'>
            <div className='rounded-full bg-blue-100 p-3'>
              <UserPlus className='h-6 w-6 text-blue-600' />
            </div>
          </div>
          <CardTitle className='text-center'>Create an account</CardTitle>
          <CardDescription className='mt-2 text-center'>
            Sign up to start documenting and mapping lived religion
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                          autoComplete='given-name'
                          autoFocus
                          required
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
                          autoComplete='family-name'
                          required
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
                        autoComplete='email'
                        required
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
                      <PasswordInput
                        placeholder='Enter password'
                        autoComplete='new-password'
                        {...field}
                        className='border-gray-300'
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                    <StrengthIndicator
                      password={field.value}
                      onUnmet={unmetRequirements => setPasswordRequirements(unmetRequirements)}
                    />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => {
                  const match = field.value.length > 0 && field.value === passwordValue;
                  const mismatch = field.value.length > 0 && field.value !== passwordValue;
                  return (
                    <FormItem>
                      <FormLabel className='text-gray-700'>Confirm Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder='Confirm password'
                          autoComplete='new-password'
                          {...field}
                          className={
                            mismatch ? 'border-red-300 focus-visible:ring-red-500'
                            : match ? 'border-green-300 focus-visible:ring-green-500'
                            : 'border-gray-300'
                          }
                          disabled={isLoading}
                        />
                      </FormControl>
                      <p aria-live='polite' className={`text-xs ${mismatch ? 'text-red-600' : match ? 'text-green-600' : 'hidden'}`}>
                        {mismatch ? 'Passwords do not match' : match ? 'Passwords match' : ''}
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                        <SelectItem value='researcher'>Researcher</SelectItem>
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
                      <Input
                        placeholder='Search instructors...'
                        value={instructorSearch}
                        onChange={e => setInstructorSearch(e.target.value)}
                        className='border-gray-300'
                        disabled={isLoading}
                      />
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
            <Link to='/login' className='font-semibold text-blue-600 underline hover:text-blue-800'>
              Log In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
