import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { authClient } from '@/app/lib/auth/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import StrengthIndicator from '@/components/ui/strength-indicator';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  head: () => ({
    meta: [{ title: "Reset Password | Where's Religion?" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unmetRequirements, setUnmetRequirements] = useState<string[]>([]);

  if (!token) {
    return (
      <div className='flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription className='mt-2'>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4'>
              <AlertTriangle className='h-5 w-5 shrink-0 text-amber-600' />
              <p className='text-sm text-amber-800'>
                Password reset links expire after a short time for security. Please request a new
                one.
              </p>
            </div>

            <div className='mt-4 flex flex-col gap-2'>
              <Link to='/forgot-password'>
                <Button className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'>
                  Request a new reset link
                </Button>
              </Link>
              <Link
                to='/login'
                className='inline-flex items-center justify-center text-sm text-blue-600 underline-offset-4 hover:underline'
              >
                <ArrowLeft className='mr-1 h-4 w-4' />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (unmetRequirements.length > 0) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: resError } = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (resError) {
        setError(resError.message || 'Password reset failed. The link may have expired.');
        return;
      }

      navigate({ to: '/login' });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Password reset failed. The link may have expired.',
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className='flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription className='mt-2'>
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='password'>New password</FieldLabel>
                <Input
                  id='password'
                  type='password'
                  placeholder='Enter new password'
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
                {password && (
                  <StrengthIndicator password={password} onUnmet={setUnmetRequirements} />
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor='confirmPassword'>Confirm password</FieldLabel>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='Confirm new password'
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className={
                    passwordsMismatch ? 'border-red-300 focus-visible:ring-red-500'
                    : passwordsMatch ?
                      'border-green-300 focus-visible:ring-green-500'
                    : ''
                  }
                />
                {passwordsMismatch && (
                  <p className='text-xs text-red-600'>Passwords do not match</p>
                )}
                {passwordsMatch && <p className='text-xs text-green-600'>Passwords match</p>}
              </Field>

              {error && <p className='text-sm text-red-600'>{error}</p>}

              <Field>
                <Button
                  type='submit'
                  className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </Button>

                <FieldDescription className='text-center'>
                  <Link
                    to='/login'
                    className='inline-flex items-center text-blue-600 underline-offset-4 hover:underline'
                  >
                    <ArrowLeft className='mr-1 h-4 w-4' />
                    Back to login
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
