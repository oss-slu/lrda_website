'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center'>
      <h2 className='text-xl font-semibold'>Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className='mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
      >
        Try again
      </button>
    </div>
  );
}
