'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from './icons';

type IconName = 'twitterX' | 'instagram' | 'github' | 'linkedin';

type IconLinkProps = {
  icon: IconName;
  href: string;
  label: string;
  className?: string;
  size?: string;
};

export function IconLink({ icon, href, label, className, size = 'w-5 h-5' }: IconLinkProps) {
  const Icon = Icons[icon];

  // Define icon-specific hover styles
  const hoverStyles = {
    github: 'hover:bg-slate-900 hover:border-slate-900 hover:text-white',
    instagram: 'hover:bg-slate-800 hover:border-slate-800 hover:text-white',
    twitterX: 'hover:bg-black hover:border-black hover:text-white',
    linkedin: 'hover:bg-blue-600 hover:border-blue-600 hover:text-white',
  };

  return (
    <a
      href={href}
      aria-label={label}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm transition-all duration-200',
        hoverStyles[icon],
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Icon className={size} />
    </a>
  );
}
