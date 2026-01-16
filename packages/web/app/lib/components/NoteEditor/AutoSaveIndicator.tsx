'use client';

import React, { useMemo } from 'react';
import { CloudUpload, CheckCircle2, Loader2 } from 'lucide-react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return 'just now';
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes === 1) {
    return '1 minute ago';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) {
    return '1 hour ago';
  }
  return `${diffInHours} hours ago`;
}

export default function AutoSaveIndicator({ isSaving, lastSavedAt }: AutoSaveIndicatorProps) {
  const timeAgo = useMemo(() => {
    if (!lastSavedAt) return null;
    return formatTimeAgo(lastSavedAt);
  }, [lastSavedAt]);

  if (isSaving) {
    return (
      <div className='inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1.5 text-sm text-blue-700 transition-all duration-300'>
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
        <span className='font-medium'>Saving...</span>
      </div>
    );
  }

  return (
    <div className='inline-flex items-center gap-2 rounded-md bg-green-50 px-2.5 py-1.5 text-sm text-green-700 transition-all duration-300'>
      <CheckCircle2 className='h-3.5 w-3.5' />
      <span className='font-medium'>Saved</span>
      {timeAgo && <span className='text-green-600'>({timeAgo})</span>}
    </div>
  );
}
