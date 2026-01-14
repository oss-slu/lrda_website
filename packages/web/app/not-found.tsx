'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Custom 404 Not Found page component
 * Displays when a user navigates to a non-existent route
 */
export default function NotFound() {
  return (
    <div
      className='relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-black'
      role='main'
      aria-label='404 Error Page'
    >
      {/* Animated background elements */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden' aria-hidden='true'>
        <div className='absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl' />
        <div
          className='absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl'
          style={{ animationDelay: '1s' }}
        />
        <div className='animate-float absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-400/10 blur-3xl' />
      </div>

      {/* Main content */}
      <div className='relative z-10 mx-auto max-w-4xl px-6 py-12 text-center'>
        {/* 404 Number */}
        <div className='mb-8'>
          <h1 className='bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-9xl font-black leading-none text-transparent sm:text-[12rem]'>
            404
          </h1>
        </div>

        {/* Error message */}
        <h2 className='mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl'>
          Page Not Found
        </h2>
        <p className='mx-auto mb-4 max-w-2xl text-xl text-blue-200 sm:text-2xl'>
          Oops! The page you're looking for seems to have wandered off the map.
        </p>
        <p className='mx-auto mb-12 max-w-xl text-lg text-blue-300/80'>
          Don't worry, we'll help you find your way back to exploring religious sites around the
          world.
        </p>

        {/* Action buttons */}
        <nav
          className='flex flex-col items-center justify-center gap-4 sm:flex-row'
          aria-label='Navigation options'
        >
          <Link href='/' aria-label='Go to home page'>
            <Button className='rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-700'>
              Go Home
            </Button>
          </Link>
          <Link href='/map' aria-label='Go to map page'>
            <Button
              variant='outline'
              className='rounded-full border-white/30 bg-white/10 px-8 py-3 text-lg font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20'
            >
              Explore Map
            </Button>
          </Link>
        </nav>
      </div>
    </div>
  );
}
