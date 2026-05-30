import { useState, useEffect } from 'react';
import { CircleAlert, CircleCheckBig, Loader2 } from 'lucide-react';

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

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: Error | null;
  onRetry: () => void;
}

export default function AutoSaveIndicator({
  isSaving,
  lastSavedAt,
  saveError,
  onRetry,
}: AutoSaveIndicatorProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!lastSavedAt) return;
    const interval = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  if (saveError) {
    return (
      <button
        onClick={onRetry}
        className='inline-flex items-center gap-2 rounded-md bg-red-50 px-2.5 py-1.5 text-sm text-red-700 transition-all duration-300 hover:bg-red-100'
      >
        <CircleAlert className='h-3.5 w-3.5' />
        <span className='font-medium'>Save failed</span>
        <span className='text-red-600 underline'>Retry</span>
      </button>
    );
  }

  if (isSaving) {
    return (
      <div className='inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1.5 text-sm text-blue-700 transition-all duration-300'>
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
        <span className='font-medium'>Saving...</span>
      </div>
    );
  }

  const timeAgo = lastSavedAt ? formatTimeAgo(lastSavedAt) : null;

  return (
    <div className='inline-flex items-center gap-2 rounded-md bg-green-50 px-2.5 py-1.5 text-sm text-green-700 transition-all duration-300'>
      <CircleCheckBig className='h-3.5 w-3.5' />
      <span className='font-medium'>Saved</span>
      {timeAgo && <span className='text-green-600'>({timeAgo})</span>}
    </div>
  );
}
