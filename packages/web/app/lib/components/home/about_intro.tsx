'use client';
import React from 'react';
import { useReveal, motionVariants } from '@/app/lib/utils/motion';
import Link from 'next/link';

export default function AboutIntro() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <section
      id='aboutSection'
      ref={ref}
      className='relative w-full overflow-hidden py-14 sm:py-20'
      data-reveal={isVisible}
    >
      {/* Background elements */}
      <div className='absolute inset-0 bg-gradient-to-bl from-slate-50 via-white to-blue-100/30'></div>
      <div className='absolute right-10 top-20 h-72 w-72 rounded-full bg-gradient-to-br from-blue-400/30 to-blue-600/20 blur-3xl'></div>

      <div className='relative z-10 mx-auto max-w-6xl px-4'>
        {/* Header section */}
        <div className={`mb-20 text-center`}>
          <h2 className='mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl'>
            <span className='bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text font-bold text-transparent'>
              ABOUT THE PLATFORM
            </span>
          </h2>
          <p className='mx-auto max-w-3xl text-xl leading-relaxed text-slate-600'>
            Building the Where's Religion platform with cutting-edge technology and innovative
            design
          </p>
        </div>

        <div className='mx-auto max-w-6xl px-4'>
          {/* Mission Statement Highlight */}
          <div
            className={`rounded-r-lg border-l-4 border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8 ${motionVariants.fadeInUp}`}
            data-reveal={isVisible}
          >
            <p className='text-lg italic leading-relaxed text-slate-800 sm:text-xl'>
              "Advancing the study of lived religion through rigorous scholarly methods that account
              for embodied experiences, improvised practices, material cultures, and shared spaces."
            </p>
          </div>

          {/* Main Description */}
          <div
            className={`mt-12 grid items-start gap-8 md:grid-cols-2 ${motionVariants.fadeInUp}`}
            data-reveal={isVisible}
          >
            <div>
              <h3 className='mb-4 text-2xl font-semibold text-slate-900'>Our Platform</h3>
              <p className='text-base leading-7 text-slate-700 sm:text-lg'>
                Where's Religion? is an open-source application developed by humanities faculty and
                IT professionals at Saint Louis University that supports in-person research, remote
                data entry, media sharing, and mapping. The app is designed to facilitate a more
                robust public understanding of religion through rigorous scholarly methods.
              </p>
            </div>

            <div>
              <h3 className='mb-4 text-2xl font-semibold text-slate-900'>Our Approach</h3>
              <p className='text-base leading-7 text-slate-700 sm:text-lg'>
                Through a research methodology that moves beyond analysis of sacred texts, creeds,
                and official teachings, Where's Religion? provides a platform to diversify the data
                we study and to advance the study of religion we all encounter in everyday life.
              </p>
            </div>
          </div>

          {/* Funding Stats */}
          <div className={`relative mt-20 ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
            <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-100 to-indigo-100 opacity-30 blur-2xl' />
            <div className='relative rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-10 shadow-md sm:p-12'>
              <div className='mb-10 text-center'>
                <h3 className='mb-2 text-3xl font-black text-slate-900 sm:text-4xl'>
                  Support & Recognition
                </h3>
                <p className='text-slate-600'>Funded by the Henry Luce Foundation</p>
              </div>

              <div className='mb-10 grid gap-8 sm:grid-cols-3'>
                <div className='group text-center'>
                  <div className='mb-4 inline-block rounded-2xl border border-slate-100 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.01]'>
                    <div className='bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-5xl font-black text-transparent sm:text-6xl'>
                      $870K
                    </div>
                  </div>
                  <div className='mb-1 text-sm font-semibold text-slate-900'>Total Funding</div>
                  <div className='text-xs text-slate-500'>Henry Luce Foundation</div>
                </div>

                <div className='group text-center'>
                  <div className='mb-4 inline-block rounded-2xl border border-slate-100 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.01]'>
                    <div className='bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-5xl font-black text-transparent sm:text-6xl'>
                      2018
                    </div>
                  </div>
                  <div className='mb-1 text-sm font-semibold text-slate-900'>Initial Award</div>
                  <div className='text-xs text-slate-500'>$400,000</div>
                </div>

                <div className='group text-center'>
                  <div className='mb-4 inline-block rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-6 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.01]'>
                    <div className='bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-5xl font-black text-transparent sm:text-6xl'>
                      2022
                    </div>
                  </div>
                  <div className='mb-1 text-sm font-semibold text-slate-900'>Follow-up Award</div>
                  <div className='text-xs text-slate-500'>$470,000</div>
                </div>
              </div>

              <div className='border-t border-slate-200 pt-8'>
                <p className='mx-auto max-w-4xl text-center text-sm leading-relaxed text-slate-700'>
                  <span className='font-bold text-slate-900'>Institutional Support:</span> College
                  of Arts & Sciences · Office for the Vice President for Research · Research
                  Computing Group · Open Source with SLU · Walter J. Ong, S.J., Center for Digital
                  Humanities · CREST Research Center
                </p>
              </div>
            </div>
          </div>

          {/* Center Connection */}
          <div className={`mt-16 text-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
            <div className='inline-block max-w-3xl rounded-3xl border-2 border-blue-200/60 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-8 py-8 shadow-lg backdrop-blur-sm'>
              <div className='mb-6'>
                <p className='mb-2 text-xl font-bold text-slate-800 sm:text-2xl'>
                  Built by the{' '}
                  <span className='bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text font-black text-transparent'>
                    Center on Lived Religion
                  </span>
                </p>
                <p className='text-base font-medium text-slate-600 sm:text-lg'>
                  Pioneering the future of digital religious studies at Saint Louis University
                </p>
              </div>
              <div className='flex flex-col flex-wrap items-center justify-center gap-3 sm:flex-row'>
                <Link
                  href='/wheres-religion'
                  className='group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-3 text-base font-semibold text-white shadow-md shadow-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50'
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
                </Link>
                <Link
                  href='/wheres-religion#faqs'
                  className='inline-flex transform items-center justify-center rounded-xl border-2 border-blue-300 bg-white px-6 py-3 font-semibold text-blue-700 shadow-sm transition-all duration-200 hover:scale-105 hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
                >
                  FAQs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
