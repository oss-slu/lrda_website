'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authClient } from '@/app/lib/auth/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auto-verify on mount if token exists
  useEffect(() => {
    if (token) {
      handleVerify(token);
    } else {
      setAutoVerifying(false);
    }
  }, [token]);

  const handleVerify = async (verifyToken: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authClient.verifyEmail({
        query: {
          token: verifyToken,
        },
      });

      // better-auth may return an object with an `error` field
      if (res && (res as any).error) {
        const err = (res as any).error;
        setError(err?.message || err || 'Email verification failed.');
        setAutoVerifying(false);
        return;
      }

      setSuccess(true);
      // Redirect to login after successful verification
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Email verification failed. Token may be expired.',
      );
      setAutoVerifying(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      await handleVerify(token);
    }
  };

  return (
    <div className='flex min-h-svh items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
        </CardHeader>
        <CardContent>
          {success ?
            <div className='space-y-4'>
              <div className='flex justify-center'>
                <CheckCircle className='h-12 w-12 text-green-600' />
              </div>
              <p className='text-center text-sm font-medium text-green-600'>
                ✓ Email verified successfully!
              </p>
              <p className='text-center text-sm text-gray-600'>Redirecting to login...</p>
            </div>
          : <form onSubmit={handleManualVerify} className='space-y-4'>
              {autoVerifying && (
                <div className='flex items-center justify-center space-x-2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600' />
                  <p className='text-sm text-gray-600'>Verifying your email...</p>
                </div>
              )}

              {!autoVerifying && !success && (
                <>
                  <div className='space-y-2'>
                    <Label>Verification Link Token</Label>
                    <p className='text-sm text-gray-600'>
                      {token ?
                        'Token received. Click verify to confirm your email.'
                      : 'No verification token found in URL.'}
                    </p>
                  </div>

                  {error && (
                    <div className='flex gap-2 rounded-lg bg-red-50 p-3'>
                      <AlertCircle className='h-5 w-5 flex-shrink-0 text-red-600' />
                      <p className='text-sm text-red-600'>{error}</p>
                    </div>
                  )}

                  <Button type='submit' className='w-full' disabled={loading || !token}>
                    {loading ? 'Verifying…' : 'Verify email'}
                  </Button>

                  <div className='flex flex-col gap-2 pt-2'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full'
                      onClick={() => router.push('/login')}
                    >
                      Go to Login
                    </Button>
                    <Button
                      type='button'
                      variant='ghost'
                      className='w-full text-sm'
                      onClick={() => router.push('/signup')}
                    >
                      Create another account
                    </Button>
                  </div>
                </>
              )}
            </form>
          }
        </CardContent>
      </Card>
    </div>
  );
}
