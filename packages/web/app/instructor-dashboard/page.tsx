'use client';

import React, { useState, useMemo } from 'react';
import { Note } from '@/app/types';
import { useAuthStore } from '../lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../lib/utils/api_service';
import InstructorEnhancedNoteCard from '../lib/components/InstructorStoriesCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const InstructorDashboardPage = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  // Fetch instructor data (user info and students)
  const { data: instructorData } = useQuery({
    queryKey: ['instructor', authUser?.uid],
    queryFn: async () => {
      if (!authUser?.uid) return null;
      const userData = await ApiService.fetchUserData(authUser.uid);
      if (!userData || !userData.isInstructor) {
        throw new Error('Access denied. Instructor only.');
      }
      return userData;
    },
    enabled: !!authUser?.uid,
  });

  const studentIds = instructorData?.students || [];

  // Fetch student notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['instructor-notes', studentIds],
    queryFn: async () => {
      if (studentIds.length === 0) {
        toast('No students linked to this instructor.');
        return [];
      }
      return await ApiService.fetchNotesByStudents(studentIds);
    },
    enabled: studentIds.length > 0,
  });

  // Fetch student names
  const { data: students = [] } = useQuery({
    queryKey: ['student-names', studentIds],
    queryFn: async () => {
      return Promise.all(
        studentIds.map(async (uid: string) => {
          const name = await ApiService.fetchCreatorName(uid);
          return { uid, name };
        }),
      );
    },
    enabled: studentIds.length > 0,
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

  const isLoading = notesLoading && studentIds.length > 0;

  return (
    <div className='flex h-[90vh] w-screen min-w-[600px] flex-col bg-gray-100 p-6'>
      {/* Search + Filter Row */}
      <div className='mb-6 flex flex-col justify-center gap-4 sm:flex-row'>
        {/* Search Box */}
        <input
          type='text'
          placeholder='Search notes...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-full max-w-md rounded-lg border p-2 shadow-sm'
        />

        {/* Student Filter Dropdown */}
        <select
          value={selectedStudent}
          onChange={e => setSelectedStudent(e.target.value)}
          className='rounded-lg border p-2 shadow-sm'
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
          {isLoading ?
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
