import React, { useState } from 'react';
import { useReveal, motionVariants } from '@/app/lib/utils/motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  id,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { ref, isVisible } = useReveal<HTMLDivElement>();

  return (
    <div
      id={id}
      ref={ref}
      className={`mb-4 scroll-mt-20 ${motionVariants.fadeInUp}`}
      data-reveal={isVisible}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='group w-full rounded-xl border-2 border-blue-200/60 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 p-5 text-left transition-all duration-200 hover:border-blue-300 hover:shadow-md'
      >
        <div className='flex items-center justify-between'>
          <h3 className='text-xl font-bold text-slate-800 transition-colors group-hover:text-blue-700'>
            {title}
          </h3>
          <div className='ml-4 flex-shrink-0'>
            {isOpen ?
              <ChevronUp className='h-5 w-5 text-blue-600' />
            : <ChevronDown className='h-5 w-5 text-blue-600' />}
          </div>
        </div>
      </button>
      {isOpen && (
        <div className='mt-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
          {children}
        </div>
      )}
    </div>
  );
}
