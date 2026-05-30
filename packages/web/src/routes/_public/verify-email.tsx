import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { authClient } from '@/auth/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, Loader2, ShieldCheck, ArrowLeft, Mail } from 'lucide-react';

export const Route = createFileRoute('/_public/verify-email')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : '',
  }),
  head: () => ({
    meta: [{ title: "Verify Email | Where's Religion?" }],
  }),
  component: VerifyEmailPage,
});

type VerifyState = 'verifying' | 'success' | 'error' | 'no-token';

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'no-token');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);

  const handleVerify = async (verifyToken: string) => {
    setState('verifying');
    setError(null);

    try {
      const { error: resError } = await authClient.verifyEmail({
        query: { token: verifyToken },
      });

      if (resError) {
        setError(resError.message || 'Verification failed.');
        setState('error');
        return;
      }

      setState('success');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Verification failed. The link may have expired.',
      );
      setState('error');
    }
  };

  // Auto-verify on mount if token is present
  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  // Countdown and redirect after success
  useEffect(() => {
    if (state !== 'success') return;
    if (countdown <= 0) {
      navigate({ to: '/login' });
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, navigate]);

  return (
    <div className='flex min-h-svh items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4'>
      <Card className='w-full max-w-md'>
        {state === 'verifying' && (
          <>
            <CardHeader>
              <div className='mb-2 flex justify-center'>
                <div className='rounded-full bg-blue-100 p-3'>
                  <ShieldCheck className='h-6 w-6 text-blue-600' />
                </div>
              </div>
              <CardTitle className='text-center'>Verifying your email</CardTitle>
              <CardDescription className='mt-2 text-center'>
                Please wait while we confirm your email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-center gap-2 py-4'>
                <Loader2 className='h-5 w-5 animate-spin text-blue-600' />
                <p className='text-muted-foreground text-sm'>Verifying...</p>
              </div>
            </CardContent>
          </>
        )}

        {state === 'success' && (
          <>
            <CardHeader>
              <div className='mb-2 flex justify-center'>
                <div className='rounded-full bg-green-100 p-3'>
                  <CheckCircle2 className='h-6 w-6 text-green-600' />
                </div>
              </div>
              <CardTitle className='text-center'>Email verified</CardTitle>
              <CardDescription className='mt-2 text-center'>
                Your email has been confirmed. You can now log in to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4'>
                <CheckCircle2 className='mt-0.5 h-5 w-5 shrink-0 text-green-600' />
                <p className='text-sm text-green-800'>
                  Your account is ready. Redirecting to login in {countdown}s...
                </p>
              </div>

              <Link to='/login' className='mt-2 block'>
                <Button className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'>
                  Go to login now
                </Button>
              </Link>
            </CardContent>
          </>
        )}

        {state === 'error' && (
          <>
            <CardHeader>
              <div className='mb-2 flex justify-center'>
                <div className='rounded-full bg-amber-100 p-3'>
                  <AlertTriangle className='h-6 w-6 text-amber-600' />
                </div>
              </div>
              <CardTitle className='text-center'>Verification failed</CardTitle>
              <CardDescription className='mt-2 text-center'>
                We were unable to verify your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4'>
                <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-600' />
                <p className='text-sm text-amber-800'>
                  {error || 'The verification link may have expired or already been used.'}
                </p>
              </div>

              <div className='flex flex-col gap-2'>
                {token && (
                  <Button
                    className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
                    onClick={() => handleVerify(token)}
                  >
                    Try again
                  </Button>
                )}

                <Link to='/confirm' search={{ email: '', sent: false }}>
                  <Button variant='outline' className='w-full'>
                    <Mail className='mr-2 h-4 w-4' />
                    Request a new verification email
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
          </>
        )}

        {state === 'no-token' && (
          <>
            <CardHeader>
              <div className='mb-2 flex justify-center'>
                <div className='rounded-full bg-amber-100 p-3'>
                  <AlertTriangle className='h-6 w-6 text-amber-600' />
                </div>
              </div>
              <CardTitle className='text-center'>Invalid verification link</CardTitle>
              <CardDescription className='mt-2 text-center'>
                This verification link is missing or incomplete.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4'>
                <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-amber-600' />
                <p className='text-sm text-amber-800'>
                  Verification links expire after a short time for security. Please request a new
                  one from the confirmation page.
                </p>
              </div>

              <div className='flex flex-col gap-2'>
                <Link to='/confirm' search={{ email: '', sent: false }}>
                  <Button className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'>
                    <Mail className='mr-2 h-4 w-4' />
                    Request a new verification email
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
          </>
        )}
      </Card>
    </div>
  );
}
