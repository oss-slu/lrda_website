'use client';

import React, { useState, useMemo } from 'react';
import { Note } from '@/app/types';
import { useAuthStore } from '../lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents, notesService } from '../lib/services';
import InstructorEnhancedNoteCard from '../lib/components/InstructorStoriesCard';
import { Skeleton } from '@/components/ui/skeleton';

const InstructorDashboardPage = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  const isInstructor = !!authUser?.isInstructor;

  // Fetch students assigned to this instructor
  const { data: students = [] } = useQuery({
    queryKey: ['instructor-students', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return [];
      return fetchStudents(authUser.uid);
    },
    enabled: !!authUser?.uid && isInstructor,
  });

  // Fetch student notes using the dedicated backend endpoint
  // fetchByStudents finds students server-side, so we don't need studentIds here
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['instructor-notes', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return [];
      return notesService.fetchByStudents(authUser.uid);
    },
    enabled: !!authUser?.uid && isInstructor,
  });

  // Filter notes by selected student and search query
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (selectedStudent) {
      filtered = filtered.filter((note: Note) => note.creator === selectedStudent);
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note: Note) =>
          note.title.toLowerCase().includes(lowerQuery) ||
          note.text.toLowerCase().includes(lowerQuery) ||
          (note.tags &&
            Array.isArray(note.tags) &&
            note.tags.some(tag =>
              (typeof tag === 'string' ? tag : tag.label).toLowerCase().includes(lowerQuery),
            )),
      );
    }

    return filtered;
  }, [notes, selectedStudent, searchQuery]);

  return (
    <div className='flex min-h-screen w-screen min-w-[600px] flex-col bg-gradient-to-br from-blue-50 to-slate-100 p-6'>
      <h1 className='mb-1 text-2xl font-bold text-gray-900'>Student Submissions</h1>
      <p className='mb-6 text-sm text-gray-500'>Review and approve notes submitted by your students.</p>

      {/* Search + Filter Row */}
      <div className='mb-6 flex flex-col justify-center gap-4 sm:flex-row'>
        <input
          type='text'
          placeholder='Search notes...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-full max-w-md rounded-lg border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
        />

        <select
          value={selectedStudent}
          onChange={e => setSelectedStudent(e.target.value)}
          className='rounded-lg border border-gray-300 bg-white p-2 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200'
        >
          <option value=''>All Students</option>
          {students.map(student => (
            <option key={student.uid} value={student.uid}>
              {student.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      <div className='flex justify-center'>
        <div className='grid max-w-screen-lg grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {notesLoading ?
            [...Array(6)].map((_, idx) => (
              <Skeleton
                key={`skeleton-${idx}`}
                className='h-[400px] w-full rounded-sm border border-gray-300'
              />
            ))
          : filteredNotes.length > 0 ?
            filteredNotes.map(note => (
              <InstructorEnhancedNoteCard key={note.id || note.title} note={note} />
            ))
          : <div className='col-span-full text-center text-gray-600'>
              No approval requests found.
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboardPage;
