'use client';
import React from 'react';
import Image from 'next/image';
import { useReveal, motionVariants } from '@/app/lib/utils/motion';
import { IconLink } from './lib/components/IconLink';
const ANIMATE_CLASS = 'animate-fadeIn opacity-0';

function WelcomeHero() {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: '120px 0px', threshold: 0.1 });
  return (
    <section
      ref={ref}
      className={`relative flex h-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat ${motionVariants.fadeIn}`}
      data-reveal={isVisible}
      style={{ backgroundImage: 'url("/splash.png")' }}
    >
      {/* Gradient overlay with modern feel */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-900/75 to-black/70' />

      {/* Animated background elements */}
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute left-10 top-20 h-72 w-72 animate-pulse rounded-full bg-blue-500/20 blur-3xl' />
        <div
          className='absolute bottom-20 right-10 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl'
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className='relative z-10 w-full p-8 text-center text-white sm:p-12'>
        <h1 className='mb-4 whitespace-nowrap bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text pb-2 text-5xl font-black leading-none tracking-tight text-transparent sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl'>
          Where&apos;s Religion?
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-xl font-light leading-relaxed text-white/95 sm:text-2xl md:text-3xl'>
          advancing the study of <span className='font-semibold text-blue-300'>religion</span> and{' '}
          <span className='font-semibold text-blue-300'>public life</span>
        </p>
        {/* CTA Buttons */}
        <div className='mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
          <a
            href='/signup'
            className='rounded-full bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700'
          >
            Get Started
          </a>
          <a
            href='/map'
            className='rounded-full border border-blue-100 bg-white/90 px-8 py-3 text-lg font-semibold text-blue-700 shadow-lg transition hover:bg-white'
          >
            Explore the Map
          </a>
        </div>
      </div>
    </section>
  );
}

export default function WelcomePage() {
  return (
    <>
      <WelcomeHero />

      <div className='relative flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 lg:flex-row'>
        {/* Left Side - Content */}
        <div className='flex h-screen flex-1 flex-col justify-center px-6 py-16 sm:px-12 lg:px-20 lg:py-24'>
          <div className='max-w-2xl'>
            {/* Main heading */}
            <h1
              className={`mb-6 text-5xl font-black leading-tight text-gray-900 sm:text-6xl lg:text-7xl ${ANIMATE_CLASS}`}
              style={{ animationDelay: '0.2s' }}
            >
              Map the world's{' '}
              <span className='bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 bg-clip-text text-transparent'>
                religious landscape
              </span>
            </h1>

            {/* Subheading */}
            <p
              className={`mb-8 text-lg leading-relaxed text-gray-600 sm:text-xl ${ANIMATE_CLASS}`}
              style={{ animationDelay: '0.3s' }}
            >
              Document, share, and explore religious sites anywhere. Built for researchers, by
              researchers.
            </p>

            {/* Feature pills */}
            <div
              className={`mb-8 flex flex-wrap gap-3 ${ANIMATE_CLASS}`}
              style={{ animationDelay: '0.4s' }}
            >
              {['Global Mapping', 'Data Collection', 'Open Source'].map((feature, i) => (
                <div
                  key={i}
                  className='cursor-default rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm'
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA and Social Links */}
            <div className='flex flex-col items-center gap-4 sm:flex-row'>
              {/* Primary CTA */}
              <a
                className='group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50'
                href='https://religioninplace.org'
                target='_blank'
                rel='noopener noreferrer'
              >
                <span className='absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                <span className='relative flex items-center gap-2'>
                  Learn More
                  <svg
                    className='h-5 w-5 transition-transform duration-300 group-hover:translate-x-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2.5}
                      d='M17 8l4 4m0 0l-4 4m4-4H3'
                    />
                  </svg>
                </span>
              </a>

              {/* Social links */}
              <div className='flex items-center gap-3'>
                <span className='hidden text-sm text-white/40 sm:block'>|</span>
                <div className='flex items-center gap-2'>
                  <IconLink
                    icon='instagram'
                    href='https://www.instagram.com/livedreligion/'
                    label='Visit Instagram'
                    size='h-6 w-6'
                    className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-md shadow-blue-500/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-white/40 hover:bg-white/20'
                  />
                  <IconLink
                    icon='twitterX'
                    href='https://twitter.com/livedreligion'
                    label='Visit Twitter/X'
                    size='h-6 w-6'
                    className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-md shadow-blue-500/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-white/40 hover:bg-white/20 hover:text-black'
                  />
                  <IconLink
                    icon='github'
                    href='https://github.com/oss-slu/lrda_website'
                    label='Visit GitHub'
                    size='h-6 w-6'
                    className='flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-md shadow-blue-500/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:border-white/40 hover:bg-white/20 hover:text-black'
                  />
                </div>
              </div>
            </div>

            {/* App downloads */}
            <div className='mt-12 flex flex-wrap gap-3'>
              <a
                href='https://apps.apple.com/us/app/wheres-religion/id6469009793'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center rounded-lg border border-gray-200 bg-white px-0 py-0 shadow-md transition-all hover:shadow-lg'
                style={{ height: 40 }}
                aria-label='Get the app on the Apple App Store'
              >
                <Image
                  src='/app_store_img.svg'
                  alt='Apple App Store'
                  width={120}
                  height={40}
                  style={{ height: 40, width: 'auto' }}
                  priority
                />
              </a>
              <a
                href='https://play.google.com/store/apps/details?id=register.edu.slu.cs.oss.lrda&pcampaignid=web_share'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white px-0 py-0 shadow-md transition-all hover:shadow-lg'
                style={{ height: 40 }}
                aria-label='Get the app on Google Play'
              >
                <Image
                  src='/01googleplay.svg'
                  alt='Google Play Store'
                  width={135}
                  height={40}
                  style={{ transform: 'scale(1.15)' }}
                  priority
                />
              </a>
            </div>
          </div>
        </div>

        {/* Right Side - App Showcase */}
        <div className='relative flex h-screen flex-1 items-center justify-center py-16 lg:py-0'>
          {/* Gradient background */}
          <div className='absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-100/30 to-pink-100/50' />

          {/* Floating elements */}
          <div className='pointer-events-none absolute inset-0'>
            <div className='animate-float absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl' />
            <div className='animate-float-delayed absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl' />
          </div>

          {/* Phone mockup */}
          <div className='relative z-10 flex items-center justify-center'>
            <div className='relative flex h-[90vh] max-h-[500px] w-64 items-center justify-center sm:max-h-[700px] sm:w-96 lg:w-96'>
              {/* Glow effect */}
              <div className='absolute inset-0 scale-105 rounded-[3rem] bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-2xl' />

              {/* Phone container with glass effect */}
              <div className='flex h-full w-full items-center justify-center overflow-hidden rounded-[3rem] border border-white/50 p-2 shadow-2xl backdrop-blur-sm'>
                <Image
                  src='/mobile_image_WR.png'
                  alt="Where's Religion App"
                  width={600}
                  height={1000}
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center',
                    width: '100%',
                    height: '100%',
                  }}
                  priority
                />
              </div>

              {/* Floating accent elements */}
              <div className='animate-float absolute -right-8 top-20 h-16 w-16 rotate-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 opacity-80 shadow-xl' />
              <div className='animate-float-delayed absolute -left-8 bottom-32 h-20 w-20 -rotate-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-80 shadow-xl' />
            </div>
          </div>
          {/* Wavy divider at the bottom */}
          <div className='pointer-events-none absolute bottom-0 left-0 right-0 z-20 w-full overflow-hidden'>
            <svg
              viewBox='0 0 600 40'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
              className='h-10 w-full'
              preserveAspectRatio='none'
            >
              <path
                d='M0,20 C150,40 450,0 600,20 L600,40 L0,40 Z'
                fill='#f8fafc' // Tailwind's slate-50
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
