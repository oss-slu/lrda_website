'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { authClient } from '@/app/lib/auth/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing verification token.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authClient.verifyEmail({
        query: {
          token,
        },
      });

      // better-auth clients may return an object with an `error` field
      if (res && (res as any).error) {
        const err = (res as any).error;
        setError(err?.message || err || 'Email verification failed.');
        return;
      }

      setSuccess(true);
      // Redirect to login after successful verification
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Email verification failed. Token may be expired.',
      );
    } finally {
      setLoading(false);
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
              <p className='text-sm font-medium text-green-600'>✓ Email verified successfully!</p>
              <p className='text-sm text-gray-600'>Redirecting to login...</p>
            </div>
          : <form onSubmit={handleVerify} className='space-y-4'>
              <div className='space-y-2'>
                <Label>Verification Link Token</Label>
                <p className='text-sm text-gray-600'>
                  {token ?
                    'Token received and ready to verify.'
                  : 'No verification token found in URL.'}
                </p>
              </div>
              {error && <p className='text-sm text-red-600'>{error}</p>}
              <Button type='submit' className='w-full' disabled={loading || !token}>
                {loading ? 'Verifying…' : 'Verify email'}
              </Button>
            </form>
          }
        </CardContent>
      </Card>
    </div>
  );
}
