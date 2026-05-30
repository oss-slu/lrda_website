import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function RootError({ error }: { error: Error }) {
  return (
    <div
      className='relative flex h-full flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-black'
      role='main'
      aria-label='Error Page'
    >
      {/* Animated background elements */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
        <div className='absolute top-20 left-10 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl' />
        <div
          className='absolute right-10 bottom-20 h-96 w-96 animate-pulse rounded-full bg-sky-500/20 blur-3xl'
          style={{ animationDelay: '1s' }}
        />
        <div className='animate-float absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-400/10 blur-3xl' />
      </div>

      {/* Main content */}
      <div className='relative z-10 mx-auto max-w-4xl px-6 py-12 text-center'>
        <div className='mb-8'>
          <h1 className='bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 bg-clip-text text-9xl leading-none font-black text-transparent sm:text-[10rem]'>
            Oops
          </h1>
        </div>

        <h2 className='mb-6 text-4xl font-bold text-white sm:text-5xl'>Something went wrong</h2>
        <p className='mx-auto mb-4 max-w-2xl text-xl text-blue-200 sm:text-2xl'>
          An unexpected error occurred. Please try refreshing the page.
        </p>

        {import.meta.env.DEV && error?.message && (
          <pre className='mx-auto mb-8 max-w-2xl overflow-auto rounded-lg border border-white/10 bg-white/5 p-4 text-left text-sm text-blue-300'>
            {error.message}
          </pre>
        )}

        <nav
          className='flex flex-col items-center justify-center gap-4 sm:flex-row'
          aria-label='Recovery options'
        >
          <Button
            onClick={() => window.location.reload()}
            className='rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-blue-500'
          >
            Refresh Page
          </Button>
          <Link to='/' aria-label='Go to home page'>
            <Button
              variant='outline'
              className='rounded-full border-white/30 bg-white/10 px-8 py-3 text-lg font-semibold text-white shadow-lg backdrop-blur-sm transition-colors duration-200 hover:border-white/50 hover:bg-white/20'
            >
              Go Home
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}
