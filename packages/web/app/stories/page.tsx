'use client';
import React, { useState, useMemo } from 'react';
import { Note } from '@/app/types';
import EnhancedClickableNote from '../lib/components/stories_card';
import { Skeleton } from '@/components/ui/skeleton';
import { useInfinitePublishedNotes } from '../lib/hooks/queries/useNotes';
import { useCreatorName } from '../lib/hooks/queries/useUsers';

// Component to display user name with caching via TanStack Query
const UserOption = ({ uid }: { uid: string }) => {
  const { data: name = 'Loading...' } = useCreatorName(uid);
  return <option value={uid}>{name}</option>;
};

const StoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');

  // Use TanStack Query infinite query for published notes
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfinitePublishedNotes(50);

  // Flatten pages into single array
  const allNotes = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Get unique creator IDs for user filter dropdown
  const uniqueCreatorIds = useMemo(() => {
    const ids = new Set(allNotes.map(note => note.creator));
    return Array.from(ids).filter(Boolean);
  }, [allNotes]);

  // Filter notes by search query and selected user
  const filteredNotes = useMemo(() => {
    let results = allNotes.filter(note => note.published === true && !note.isArchived);

    // Filter by selected user
    if (selectedUser) {
      results = results.filter(note => note.creator === selectedUser);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      results = results.filter(
        note =>
          note.title?.toLowerCase().includes(lowerQuery) ||
          note.text?.toLowerCase().includes(lowerQuery) ||
          note.tags?.some(tag => tag?.label?.toLowerCase().includes(lowerQuery)),
      );
    }

    // Sort by date (most recent first)
    return results.sort((a, b) => {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return dateB - dateA;
    });
  }, [allNotes, searchQuery, selectedUser]);

  // Intersection observer for infinite scroll
  const loaderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className='flex min-h-screen w-full flex-col bg-gray-100 p-2 sm:p-4'>
      {/* Search Bar - Centered */}
      <div className='mb-6 flex w-full justify-center sm:mb-8'>
        <div className='flex w-full max-w-4xl flex-col gap-2 sm:flex-row sm:gap-4'>
          <input
            type='text'
            placeholder='Search stories...'
            className='w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:flex-1 sm:p-4 sm:text-base'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {/* Dropdown for filtering by user */}
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className='w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-auto sm:min-w-[200px] sm:p-4 sm:text-base'
          >
            <option value=''>All Users</option>
            {uniqueCreatorIds.map(uid => (
              <UserOption key={uid} uid={uid} />
            ))}
          </select>
        </div>
      </div>

      {/* Stories Grid - Mobile Responsive */}
      <div className='w-full px-2 sm:px-4 lg:px-6'>
        <div className='grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4 2xl:grid-cols-5'>
          {isLoading ?
            [...Array(6)].map((_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
                className='h-[450px] w-full rounded-xl border border-gray-200 sm:h-[500px] lg:h-[550px]'
              />
            ))
          : filteredNotes.length > 0 ?
            filteredNotes.map(note => {
              const noteId = note.id || (note as Record<string, unknown>)['@id'];
              return <EnhancedClickableNote key={noteId as string} note={note} />;
            })
          : <div className='col-span-full py-8 text-center'>
              <p className='text-lg text-gray-600'>No stories found.</p>
            </div>
          }
        </div>
      </div>

      {/* Infinite Scroll Loader */}
      {filteredNotes.length > 0 && (
        <div className='mb-4 mt-6 flex justify-center'>
          {hasNextPage ?
            <div ref={loaderRef} className='flex h-10 w-full items-center justify-center'>
              {isFetchingNextPage && (
                <div
                  className='h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary'
                  aria-label='Loading more stories'
                />
              )}
            </div>
          : <div className='py-4 text-center'>
              <p className='text-sm text-gray-500'>No more stories to load.</p>
            </div>
          }
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
