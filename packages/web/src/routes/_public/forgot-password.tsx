import { createFileRoute, Link  } from '@tanstack/react-router';
import { useState, useCallback } from 'react';
import { authClient } from '@/auth/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { ResendButton } from '@/components/ui/resend-button';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';

export const Route = createFileRoute('/_public/forgot-password')({
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: ForgotPasswordPage,
  head: () => ({
    meta: [{ title: "Forgot Password | Where's Religion?" }],
  }),
});

function ForgotPasswordPage() {
  const { email: prefillEmail } = Route.useSearch();
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendResetEmail = useCallback(async (emailAddress: string) => {
    await authClient.requestPasswordReset({
      email: emailAddress,
      redirectTo: `${window.location.origin}/reset-password`,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendResetEmail(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    await sendResetEmail(email);
  }, [email, sendResetEmail]);

  return (
    <div className='flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <div className='mb-2 flex justify-center'>
            <div className='rounded-full bg-blue-100 p-3'>
              <Mail className='h-6 w-6 text-blue-600' />
            </div>
          </div>
          <CardTitle className='text-center'>
            {submitted ? 'Check your email' : 'Forgot your password?'}
          </CardTitle>
          <CardDescription className='mt-2 text-center'>
            {submitted ?
              `We sent a password reset link to ${email}`
            : "Enter your email and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {submitted ?
            <div className='space-y-4'>
              <div className='flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-green-600' />
                <p className='text-sm text-green-800'>
                  If an account exists for that email, you will receive a password reset link
                  shortly. Be sure to check your spam folder.
                </p>
              </div>

              <div className='flex flex-col gap-2'>
                <ResendButton
                  onResend={handleResend}
                  label='Resend reset link'
                  resendingLabel='Sending...'
                  className='w-full'
                />

                <Button
                  variant='ghost'
                  className='text-muted-foreground w-full'
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                  }}
                >
                  Try a different email
                </Button>

                <Link
                  to='/login'
                  className='inline-flex items-center justify-center text-sm text-blue-600 underline-offset-4 hover:underline'
                >
                  <ArrowLeft className='mr-1 h-4 w-4' />
                  Back to login
                </Link>
              </div>
            </div>
          : <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor='email'>Email address</FieldLabel>
                  <Input
                    id='email'
                    type='email'
                    placeholder='you@example.com'
                    autoComplete='email'
                    autoFocus
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </Field>

                {error && <p className='text-sm text-red-600'>{error}</p>}

                <Field>
                  <Button
                    type='submit'
                    className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : 'Send reset link'}
                  </Button>

                  <FieldDescription className='text-center'>
                    Remember your password?{' '}
                    <Link to='/login' className='text-blue-600 underline-offset-4 hover:underline'>
                      Back to login
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          }
        </CardContent>
      </Card>
    </div>
  );
}
