'use client';
import { Calendar, MapPin } from 'lucide-react';

const NoteToolbar = () => {
  return (
    <div className='rounded bg-white p-2 shadow'>
      {' '}
      {/* Added 'shadow' for consistency if needed */}
      <div className='flex items-center justify-between gap-4'>
        {' '}
        {/* Removed styling here and applied to parent */}
        <span title='Calendar'>
          <Calendar className='cursor-pointer text-gray-600 hover:text-gray-800' />
        </span>
        <span title='Location'>
          <MapPin className='cursor-pointer text-gray-600 hover:text-gray-800' />
        </span>
      </div>
    </div>
  );
};

export default NoteToolbar;
