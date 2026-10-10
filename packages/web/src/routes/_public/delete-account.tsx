import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { CircleCheckBig, Loader2, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/_public/delete-account')({
  ssr: false,
  component: DeleteAccountPage,
  head: () => ({
    meta: [{ title: "Delete Account | Where's Religion?" }],
  }),
});

function DeleteAccountPage() {
  const { user, isLoading, deleteAccount } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isLoading: state.isLoading,
      deleteAccount: state.deleteAccount,
    })),
  );

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await deleteAccount(password);
      setDeleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (deleted) {
      return (
        <div className='space-y-4'>
          <div className='flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4'>
            <CircleCheckBig className='mt-0.5 h-5 w-5 shrink-0 text-green-600' />
            <p className='text-sm text-green-800'>
              Your account and its data have been permanently deleted.
            </p>
          </div>
          <Button variant='outline' asChild className='w-full'>
            <Link to='/'>Return to home</Link>
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className='flex justify-center py-4'>
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        </div>
      );
    }

    if (!user) {
      return (
        <Button
          asChild
          className='w-full bg-blue-600 text-white hover:bg-blue-700 hover:text-white'
        >
          <Link to='/login' search={{ redirect: '/delete-account' }}>
            Log in to continue
          </Link>
        </Button>
      );
    }

    return (
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900'>
            <p>
              This permanently deletes <span className='font-medium'>{user.email}</span>. It cannot
              be undone. The following will be removed:
            </p>
            <ul className='mt-2 list-disc space-y-1 pl-5'>
              <li>Your profile and login</li>
              <li>All of your notes, published or not, and the comments on them</li>
              <li>All comments you have left on other notes</li>
              {user.isInstructor && (
                <li>Your link to your students. Their accounts and notes are not affected.</li>
              )}
            </ul>
          </div>

          <Field>
            <FieldLabel htmlFor='password'>Enter your password to confirm</FieldLabel>
            <PasswordInput
              id='password'
              autoComplete='current-password'
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={submitting}
            />
          </Field>

          {error && <p className='text-sm text-red-600'>{error}</p>}

          <Field>
            <Button
              type='submit'
              className='w-full bg-red-600 text-white hover:bg-red-700 hover:text-white'
              disabled={submitting || !password}
            >
              {submitting ? 'Deleting...' : 'Permanently delete account'}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    );
  };

  return (
    <div className='flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <div className='mb-2 flex justify-center'>
            <div className='rounded-full bg-red-100 p-3'>
              <Trash2 className='h-6 w-6 text-red-600' />
            </div>
          </div>
          <CardTitle className='text-center'>
            {deleted ? 'Account deleted' : 'Delete your account'}
          </CardTitle>
          {!deleted && !user && !isLoading && (
            <CardDescription className='mt-2 text-center'>
              Log in to the account you want to delete.
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
