'use client';
import React from 'react';
import Image from 'next/image';
import { Icons } from '@/app/lib/components/icons';
import { useReveal, motionVariants } from '@/app/lib/utils/motion';

type TeamCardProps = {
  name: string;
  role: string;
  src: string;
  socials?: { github?: string; linkedin?: string };
  delay?: number;
};

export default function TeamCard({ name, role, src, socials, delay = 0 }: TeamCardProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: '120px 0px' });

  return (
    <div
      ref={ref}
      className={`group relative ${motionVariants.scaleIn}`}
      data-reveal={isVisible}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Animated background gradient */}
      <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100'></div>

      {/* Main card */}
      <div className='relative rounded-2xl border border-slate-100 bg-white/80 p-8 shadow-lg shadow-slate-200/50 backdrop-blur-sm transition-all duration-500 group-hover:border-slate-200 group-hover:shadow-xl group-hover:shadow-slate-300/50'>
        {/* Profile image */}
        <div className='relative mx-auto mb-6 h-24 w-24'>
          {/* Animated ring */}
          <div className='absolute inset-0 rotate-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[2px] opacity-0 transition-all duration-500 group-hover:rotate-180 group-hover:opacity-100'>
            <div className='h-full w-full rounded-full bg-white'></div>
          </div>

          {/* Image container */}
          <div className='relative h-full w-full overflow-hidden rounded-full transition-all duration-300'>
            <Image
              src={src}
              alt={name}
              width={96}
              height={96}
              className='group-hover:saturate-110 h-full w-full object-cover transition-all duration-500 group-hover:scale-110'
            />
          </div>
        </div>

        {/* Name and role */}
        <div className='space-y-2 text-center'>
          <h3 className='text-lg font-bold text-slate-900 transition-colors duration-300 group-hover:text-slate-800'>
            {name}
          </h3>
          <p className='text-sm font-medium text-slate-600 transition-colors duration-300 group-hover:text-slate-700'>
            {role}
          </p>
        </div>

        {/* Social links */}
        {socials && (
          <div className='mt-6 flex justify-center space-x-3'>
            {socials.github && (
              <a
                href={socials.github}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`${name} on GitHub`}
                className='group/social relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-slate-900 hover:text-white hover:shadow-lg'
              >
                <Icons.github className='h-4 w-4 transition-transform duration-300 group-hover/social:scale-110' />
              </a>
            )}
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={`${name} on LinkedIn`}
                className='group/social relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-300 hover:scale-110 hover:bg-blue-600 hover:text-white hover:shadow-lg'
              >
                <Icons.linkedin className='h-4 w-4 transition-transform duration-300 group-hover/social:scale-110' />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
