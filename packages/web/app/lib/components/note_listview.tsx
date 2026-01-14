import React, { useState, useEffect } from 'react';
import { Note, newNote } from '../../types';
import { format12hourTime } from '../utils/data_conversion';
import { FileText, Search, FileEdit } from 'lucide-react';
import { useNotesStore } from '../stores/notesStore';
import { useShallow } from 'zustand/react/shallow';
import ApiService from '../utils/api_service';

type NoteListViewProps = {
  notes: Note[];
  onNoteSelect: (note: Note, isNewNote: boolean) => void;
  isSearching?: boolean;
  viewMode?: 'my' | 'review';
  isInstructor?: boolean;
  draftNote?: newNote | null;
  onDraftSelect?: () => void;
};

const batch_size = 15; //can change batch loading here

const extractTextFromHtml = (htmlString: string) => {
  const tempDivElement = document.createElement('div');
  tempDivElement.innerHTML = htmlString;
  return tempDivElement.textContent || tempDivElement.innerText || '';
};

const NoteListView: React.FC<NoteListViewProps> = ({
  notes,
  onNoteSelect,
  isSearching = false,
  viewMode = 'my',
  isInstructor = false,
  draftNote = null,
  onDraftSelect,
}) => {
  const { selectedNoteId, setSelectedNoteId, clearDraftNote } = useNotesStore(
    useShallow(state => ({
      selectedNoteId: state.selectedNoteId,
      setSelectedNoteId: state.setSelectedNoteId,
      clearDraftNote: state.clearDraftNote,
    })),
  );
  const [fresh, setFresh] = useState(true);
  const [visibleCount, setVisibleCount] = useState(batch_size);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

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
              const name = await ApiService.fetchCreatorName(creatorId);
              names[creatorId] = name || 'Unknown User';
            } catch (error) {
              console.error(`Error fetching creator name for ${creatorId}:`, error);
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

  const handleLoadText = (note: Note) => {
    clearDraftNote(); // Clear draft when clicking on an existing note
    onNoteSelect(note, false);
    setSelectedNoteId(note.id);
  };

  const handleDraftSelect = () => {
    setSelectedNoteId('draft'); // Set special ID to indicate draft is active
    if (onDraftSelect) {
      onDraftSelect();
    }
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

  const moreNotes = () => {
    setVisibleCount(prev => prev + batch_size);
  };

  // Empty state: no notes at all
  if (notes.length === 0 && !isSearching) {
    return (
      <div className='flex flex-col items-center justify-center px-4 py-12 text-center'>
        <div className='mb-4 rounded-full bg-blue-50 p-4'>
          <FileText className='h-8 w-8 text-blue-500' />
        </div>
        <h3 className='mb-2 text-lg font-semibold text-gray-900'>No notes yet</h3>
        <p className='mb-4 max-w-xs text-sm text-gray-600'>
          Click the "New Note" button below to create your first note!
        </p>
      </div>
    );
  }

  // Empty state: search returned no results
  if (notes.length === 0 && isSearching) {
    return (
      <div className='flex flex-col items-center justify-center px-4 py-12 text-center'>
        <div className='mb-4 rounded-full bg-gray-50 p-4'>
          <Search className='h-8 w-8 text-gray-400' />
        </div>
        <h3 className='mb-2 text-lg font-semibold text-gray-900'>No results found</h3>
        <p className='max-w-xs text-sm text-gray-600'>
          Try adjusting your search or check the other tab
        </p>
      </div>
    );
  }

  return (
    <div id='notes-list' className='my-4 flex flex-col'>
      {/* Draft note - shown at top when present */}
      {draftNote && (
        <div
          className={`z-10 mb-1.5 cursor-pointer rounded-lg p-2.5 shadow-sm transition-all duration-200 ${
            selectedNoteId === 'draft' ?
              'border-2 border-blue-300 bg-blue-50 text-blue-900 shadow-md'
            : 'border-2 border-dashed border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:shadow-md'
          }`}
          onClick={handleDraftSelect}
        >
          <div className='flex flex-col space-y-1'>
            <div className='flex flex-row items-start justify-between'>
              <h3 className='mr-2 flex-1 truncate text-sm font-semibold'>
                {draftNote.title || 'Untitled'}
              </h3>
              <span className='inline-flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800'>
                <FileEdit className='h-3 w-3' />
                Draft
              </span>
            </div>
            <p className='truncate text-xs leading-relaxed text-amber-700'>
              {draftNote.text ? extractTextFromHtml(draftNote.text) : 'Start typing to save...'}
            </p>
          </div>
        </div>
      )}
      {notes.slice(0, visibleCount).map(note => {
        let noteTextContent = extractTextFromHtml(note.text);
        if (
          noteTextContent === undefined ||
          noteTextContent === null ||
          noteTextContent === '' ||
          noteTextContent === 'undefined'
        ) {
          noteTextContent = 'Empty note';
        }

        return (
          <div
            key={note.id}
            className={`z-10 mb-1.5 cursor-pointer rounded-lg p-2.5 shadow-sm transition-all duration-200 ${
              note.id === selectedNoteId ?
                'border border-blue-300 bg-blue-50 text-blue-900 shadow-md'
              : 'border border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md'
            }`}
            onClick={() => handleLoadText(note)}
          >
            <div className='flex flex-col space-y-1'>
              <div className='flex flex-row items-start justify-between'>
                <h3 className='mr-2 flex-1 truncate text-sm font-semibold'>
                  {note.title || 'Untitled'}
                </h3>
                <span className='flex-shrink-0 text-xs text-gray-500'>
                  {handleGetTime(note.time)}
                </span>
              </div>
              {viewMode === 'review' && isInstructor && note.creator && (
                <p className='text-xs font-medium text-gray-500'>
                  By: {creatorNames[note.creator] || 'Loading...'}
                </p>
              )}
              <p className='truncate text-xs leading-relaxed text-gray-600'>{noteTextContent}</p>
            </div>
          </div>
        );
      })}

      {visibleCount < notes.length && (
        <div className='mt-4 flex justify-center'>
          <button
            onClick={moreNotes}
            className='rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700'
          >
            Load More Notes...
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteListView;
