'use client';
import React from 'react';
import Image from 'next/image';
import { Icons } from '@/app/lib/components/icons';
import { useReveal, motionVariants } from '@/app/lib/utils/motion';

type ContributorCardProps = {
  name: string;
  role: string;
  src: string;
  socials?: { github?: string; linkedin?: string };
  delay?: number;
  offset?: number;
};

export default function ContributorCard({
  name,
  role,
  src,
  socials,
  delay = 0,
  offset = 20,
}: ContributorCardProps) {
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
      {/* Card */}
      <div className='relative h-64 overflow-hidden rounded-3xl bg-slate-900'>
        {/* Background image */}
        <div className='absolute inset-0'>
          <Image
            src={src}
            alt={name}
            fill
            className='object-cover transition-transform duration-700 group-hover:scale-[1.02]'
            style={{ objectPosition: `center ${offset}%` }}
          />

          {/* Dark overlay gradient */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20'></div>
        </div>

        {/* Content overlay */}
        <div className='absolute inset-0 z-10 flex flex-col justify-end p-5'>
          {/* Decorative line */}
          <div className='mb-2 h-0.5 w-8 bg-blue-600'></div>

          {/* Role tag */}
          <div className='mb-2 inline-block self-start'>
            <span className='rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm'>
              {role}
            </span>
          </div>

          {/* Name */}
          <h3 className='text-xl font-bold tracking-tight text-white'>{name}</h3>

          {/* Social links bottom right */}
          {socials && (
            <div className='absolute bottom-5 right-5 flex gap-2'>
              {socials.github && (
                <a
                  href={socials.github}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`${name} on GitHub`}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-slate-900'
                >
                  <Icons.github className='h-3.5 w-3.5' />
                </a>
              )}
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`${name} on LinkedIn`}
                  className='inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-all duration-200 hover:bg-blue-600'
                >
                  <Icons.linkedin className='h-3.5 w-3.5' />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
