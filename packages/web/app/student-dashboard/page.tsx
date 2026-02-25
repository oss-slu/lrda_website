'use client';

import React, { useState, useMemo } from 'react';
import { Note } from '@/app/types';
import { useAuthStore } from '../lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import { notesService } from '../lib/services';
import InstructorEnhancedNoteCard from '../lib/components/InstructorStoriesCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommentPreview } from '../lib/hooks/queries/useComments';

/** Wrapper component that fetches comment preview per note */
function StudentNotePreview({ note }: { note: Note }) {
  const { preview } = useCommentPreview(note.id);

  return (
    <div className='flex flex-col rounded-lg bg-white shadow-sm'>
      <InstructorEnhancedNoteCard note={note} />

      <div className='border-t border-blue-100 bg-blue-50/50 p-4'>
        <h4 className='mb-2 text-sm font-semibold text-blue-900'>Recent Feedback:</h4>
        {preview.length > 0 ?
          preview.map(c => (
            <div key={String(c.id)} className='mb-1 text-xs text-gray-700'>
              <span className='font-medium'>{String(c.authorName)}:</span>{' '}
              {c.text.length > 100 ? c.text.slice(0, 100) + '...' : c.text}
            </div>
          ))
        : <p className='text-xs text-gray-500'>No feedback yet.</p>}
      </div>
    </div>
  );
}

const StudentDashboardPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  // Fetch notes with pending feedback
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['student-feedback', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return [];

      // Fetch notes created by this student that have approval requested
      const fetched = await notesService.fetchUserNotes(authUser.uid, 150, 0);
      return fetched.filter(note => !!note.approvalRequested && !note.published);
    },
    enabled: !!authUser?.uid,
  });

  // Filter notes by search query (title only -- comments are fetched separately)
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;

    const lower = searchQuery.toLowerCase();
    return notes.filter(note => note.title.toLowerCase().includes(lower));
  }, [notes, searchQuery]);

  return (
    <div className='flex min-h-screen w-screen min-w-[600px] flex-col bg-gradient-to-br from-blue-50 to-slate-100 p-6'>
      <h1 className='mb-1 text-2xl font-bold text-gray-900'>Pending Feedback</h1>
      <p className='mb-6 text-sm text-gray-500'>Notes you've submitted for instructor review.</p>

      {/* Search Box */}
      <div className='mb-6 flex justify-center'>
        <input
          type='text'
          placeholder='Search feedback...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-full max-w-md rounded-lg border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
        />
      </div>

      <div className='flex justify-center'>
        <div className='grid max-w-screen-lg grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {isLoading ?
            [...Array(6)].map((_, idx) => (
              <Skeleton
                key={`skeleton-${idx}`}
                className='h-[400px] w-full rounded-sm border border-gray-300'
              />
            ))
          : filteredNotes.length > 0 ?
            filteredNotes.map(note => <StudentNotePreview key={note.id} note={note} />)
          : <div className='col-span-full text-center text-gray-600'>
              No feedback to review at the moment.
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
