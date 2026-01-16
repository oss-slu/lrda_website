import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Note } from '../../types';
import { format12hourTime } from '../utils/data_conversion';
import { extractTextFromHtml } from '../utils/sanitize';
import { FileText, Search, Loader2 } from 'lucide-react';
import { useNotesStore } from '../stores/notesStore';
import { useShallow } from 'zustand/react/shallow';
import { usersService } from '../services';
import { Skeleton } from '@/components/ui/skeleton';

type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
  isSearching?: boolean;
  viewMode?: 'my' | 'review';
  isInstructor?: boolean;
};

const BATCH_SIZE = 15;

const NoteListView: React.FC<NoteListViewProps> = ({
  notes,
  onNoteSelect,
  isSearching = false,
  viewMode = 'my',
  isInstructor = false,
}) => {
  const { selectedNoteId, setSelectedNoteId } = useNotesStore(
    useShallow(state => ({
      selectedNoteId: state.selectedNoteId,
      setSelectedNoteId: state.setSelectedNoteId,
    })),
  );
  const [fresh, setFresh] = useState(true);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notes.length > 0 && fresh) {
      onNoteSelect(notes[0], false);
      setSelectedNoteId(notes[0].id);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mark as initialized after first note selection
      setFresh(false);
    }
  }, [notes, onNoteSelect, fresh, setSelectedNoteId]);

  // Fetch creator names for instructors in review mode
  useEffect(() => {
    const fetchCreatorNames = async () => {
      if (viewMode === 'review' && isInstructor) {
        const names: Record<string, string> = {};
        const uniqueCreators = Array.from(
          new Set(notes.map(note => note.creator).filter(Boolean) as string[]),
        );

        await Promise.all(
          uniqueCreators.map(async creatorId => {
            try {
              const name = await usersService.fetchCreatorName(creatorId);
              names[creatorId] = name || 'Unknown User';
            } catch {
              names[creatorId] = 'Unknown User';
            }
          }),
        );

        setCreatorNames(names);
      } else {
        setCreatorNames({});
      }
    };

    fetchCreatorNames();
  }, [notes, viewMode, isInstructor]);

  // Infinite scroll with IntersectionObserver
  const loadMore = useCallback(() => {
    if (visibleCount >= notes.length || isLoadingMore) return;

    setIsLoadingMore(true);
    // Small delay for smoother UX
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + BATCH_SIZE, notes.length));
      setIsLoadingMore(false);
    }, 150);
  }, [visibleCount, notes.length, isLoadingMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '100px', threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleLoadText = (note: Note) => {
    onNoteSelect(note, false);
    setSelectedNoteId(note.id);
  };

  const handleGetTime = (inputDate: Date) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const checkDate = new Date(inputDate.getTime());
    checkDate.setHours(0, 0, 0, 0);
    const dayDifference = (currentDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24);

    if (dayDifference === 0) {
      return format12hourTime(inputDate);
    } else if (dayDifference === 1) {
      return 'Yesterday';
    } else {
      return inputDate.toLocaleDateString();
    }
  };

  // Empty state: no notes at all
  if (notes.length === 0 && !isSearching) {
    return (
      <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
        <div className='mb-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6'>
          <FileText className='h-10 w-10 text-blue-600' />
        </div>
        <h3 className='mb-2 text-xl font-bold text-gray-900'>No notes yet</h3>
        <p className='max-w-sm text-sm leading-relaxed text-gray-600'>
          Get started by clicking the "New Note" button below to create your first note!
        </p>
      </div>
    );
  }

  // Empty state: search returned no results
  if (notes.length === 0 && isSearching) {
    return (
      <div className='flex flex-col items-center justify-center px-4 py-16 text-center'>
        <div className='mb-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
          <Search className='h-10 w-10 text-gray-400' />
        </div>
        <h3 className='mb-2 text-xl font-bold text-gray-900'>No results found</h3>
        <p className='max-w-sm text-sm leading-relaxed text-gray-600'>
          Try adjusting your search or check the other tab
        </p>
      </div>
    );
  }

  return (
    <div id='notes-list' className='my-4 flex flex-col gap-2'>
      {/* Note cards */}
      {notes.slice(0, visibleCount).map(note => {
        let noteTextContent = extractTextFromHtml(note.text);
        if (!noteTextContent || noteTextContent === 'undefined') {
          noteTextContent = 'Empty note';
        }
        const isSelected = note.id === selectedNoteId;

        return (
          <div
            key={note.id}
            className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? 'border-blue-400 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => handleLoadText(note)}
          >
            <div className='flex flex-col gap-1.5 p-3'>
              <div className='flex flex-row items-center justify-between gap-2'>
                <h3 className='flex-1 truncate text-sm font-semibold text-gray-900'>
                  {note.title || 'Untitled'}
                </h3>
                <span className='flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'>
                  {handleGetTime(note.time)}
                </span>
              </div>
              {viewMode === 'review' && isInstructor && note.creator && (
                <p className='text-xs font-medium text-blue-600'>
                  {creatorNames[note.creator] || 'Loading...'}
                </p>
              )}
              <p className='line-clamp-2 text-xs leading-relaxed text-gray-600'>{noteTextContent}</p>
            </div>
          </div>
        );
      })}

      {/* Infinite scroll sentinel & loading indicator */}
      {visibleCount < notes.length && (
        <div ref={sentinelRef} className='flex justify-center py-4'>
          {isLoadingMore ? (
            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <Loader2 className='h-4 w-4 animate-spin' />
              <span>Loading more...</span>
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              <Skeleton className='h-16 w-full rounded-xl' />
              <Skeleton className='h-16 w-full rounded-xl' />
            </div>
          )}
        </div>
      )}

      {/* End of list indicator */}
      {visibleCount >= notes.length && notes.length > BATCH_SIZE && (
        <div className='py-4 text-center text-xs text-gray-400'>
          All {notes.length} notes loaded
        </div>
      )}
    </div>
  );
};

export default NoteListView;
