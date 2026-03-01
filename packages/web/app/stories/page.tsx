'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import EnhancedClickableNote from '../lib/components/stories_card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useInfinitePublishedNotes } from '../lib/hooks/queries/useNotes';
import { useCreatorName } from '../lib/hooks/queries/useUsers';

// Component to display user name with caching via TanStack Query
const UserOption = ({ uid }: { uid: string }) => {
  const { data: name = 'Loading...' } = useCreatorName(uid);
  return <SelectItem value={uid}>{name}</SelectItem>;
};

const StoriesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');

  // Track all unique creator IDs across all pages (persistent ref)
  const allCreatorsRef = useRef<Set<string>>(new Set());

  // Use TanStack Query infinite query for published notes with server-side filtering
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfinitePublishedNotes(20, {
      search: searchQuery,
      creatorId: selectedUser !== 'all' ? selectedUser : undefined,
      sort: sortOrder,
    });

  // Flatten pages into single array
  const allNotes = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data);
  }, [data]);

  // Update the persistent set of all creators seen (across all pages and filters)
  useEffect(() => {
    allNotes.forEach(note => {
      if (note.creator) {
        allCreatorsRef.current.add(note.creator);
      }
    });
  }, [allNotes]);

  // Get unique creator IDs for user filter dropdown (from persistent set, updated whenever allNotes changes)
  const uniqueCreatorIds = useMemo(() => {
    return Array.from(allCreatorsRef.current).filter(Boolean);
  }, [allNotes]);

  // Intersection observer for infinite scroll
  const loaderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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
      {/* Filter Bar - Centered */}
      <div className='mb-6 flex w-full justify-center sm:mb-8'>
        <div className='flex w-full max-w-5xl flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:gap-4 sm:p-5'>
          {/* Search Input */}
          <Input
            type='text'
            placeholder='Search stories...'
            className='flex-1'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          {/* User Filter Dropdown */}
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className='w-full sm:w-auto sm:min-w-[180px]'>
              <SelectValue placeholder='All Users' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Users</SelectItem>
              {uniqueCreatorIds.map(uid => (
                <UserOption key={uid} uid={uid} />
              ))}
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select
            value={sortOrder}
            onValueChange={value => setSortOrder(value as 'newest' | 'oldest' | 'alphabetical')}
          >
            <SelectTrigger className='w-full sm:w-auto sm:min-w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>Newest First</SelectItem>
              <SelectItem value='oldest'>Oldest First</SelectItem>
              <SelectItem value='alphabetical'>A to Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stories Grid - Mobile Responsive */}
      <div className='w-full px-2 sm:px-4 lg:px-6'>
        <div className='grid w-full grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-10 xl:grid-cols-4'>
          {isLoading ?
            [...Array(6)].map((_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
                className='h-[400px] w-full rounded-xl border border-gray-200'
              />
            ))
          : allNotes.length > 0 ?
            allNotes.map(note => {
              const noteId = note.id || (note as Record<string, unknown>)['@id'];
              return <EnhancedClickableNote key={noteId as string} note={note} />;
            })
          : <div className='col-span-full py-12 text-center'>
              <p className='mb-2 text-lg font-medium text-gray-700'>No stories found</p>
              <p className='text-sm text-gray-500'>
                {searchQuery || selectedUser ?
                  'Try adjusting your filters'
                : 'Check back soon for new stories'}
              </p>
            </div>
          }
        </div>
      </div>

      {/* Infinite Scroll Loader */}
      {allNotes.length > 0 && (
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
          : allNotes.length > 0 && (
              <div className='py-4 text-center'>
                <p className='text-sm text-gray-500'>No more stories to load.</p>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
};

export default StoriesPage;
