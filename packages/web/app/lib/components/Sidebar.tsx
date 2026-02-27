'use client';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import SearchBarNote from './search_bar_note';
import NoteListView from './note_listview';
import { Note, newNote } from '@/app/types';
import { useNotesStore } from '../stores/notesStore';
import { useAuthStore } from '../stores/authStore';
import { isInstructorUser, isAdminUser } from '../stores/authHelpers';
import { useShallow } from 'zustand/react/shallow';
import { notesService } from '../services';
import { usePersonalNotes, useStudentNotes, notesKeys } from '../hooks/queries/useNotes';
import { useQueryClient } from '@tanstack/react-query';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const { viewMode, setSelectedNoteId } = useNotesStore(
    useShallow(state => ({
      viewMode: state.viewMode,
      setSelectedNoteId: state.setSelectedNoteId,
    })),
  );
  const { user, isInitialized } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isInitialized: state.isInitialized,
    })),
  );

  const queryClient = useQueryClient();

  const [showPublished, setShowPublished] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Note[] | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  const isInstructor = isInstructorUser(user) || isAdminUser(user);

  // TanStack Query for personal notes.
  // Gate on isInitialized so the API call doesn't fire before the session
  // cookie is re-validated on page refresh. Without this, the API treats
  // the user as anonymous and returns only published notes.
  const { data: personalNotes = [] } = usePersonalNotes(
    viewMode === 'my' && isInitialized ? (user?.id ?? null) : null,
  );

  // TanStack Query for student notes (instructor review mode) with automatic polling
  const { data: studentNotes = [] } = useStudentNotes(
    isInitialized ? (user?.id ?? null) : null,
    isInstructor && viewMode === 'review',
  );

  const handleAddNote = async () => {
    const userId = user?.id;
    if (!userId) {
      console.error('User ID is null - cannot create a new note');
      return;
    }

    if (isCreatingNote) return; // Prevent double-clicks

    setIsCreatingNote(true);
    try {
      // Create the note on the server immediately
      const newNoteData = {
        title: '',
        text: '',
        time: new Date(),
        media: [],
        audio: [],
        creator: userId,
        latitude: '',
        longitude: '',
        published: false,
        tags: [],
      };

      const data = await notesService.create(newNoteData);
      const newNoteId = data.id;

      if (!newNoteId) {
        throw new Error('No ID returned from server');
      }

      const savedNote: Note = {
        ...newNoteData,
        id: newNoteId,
        uid: newNoteId,
      };

      // Add to query cache immediately for instant UI update
      queryClient.setQueryData<Note[]>(notesKeys.personal(userId), old =>
        old ? [savedNote, ...old] : [savedNote],
      );

      setSelectedNoteId(newNoteId);
      onNoteSelect(savedNote, false);
    } catch (error) {
      console.error('Error creating new note:', error);
    } finally {
      setIsCreatingNote(false);
    }
  };

  // Reset to showing "Unreviewed" when switching to review mode
  useEffect(() => {
    if (viewMode === 'review') {
       
      setShowPublished(false);
    }
  }, [viewMode]);

  // Derive filteredNotes from source data
  const filteredNotes = useMemo(() => {
    if (isSearching && searchResults !== null) {
      return searchResults;
    }

    const notesToFilter = viewMode === 'review' ? studentNotes : personalNotes;

    if (viewMode === 'review') {
      if (showPublished) {
        return notesToFilter.filter(n => !!n.published);
      } else {
        return notesToFilter.filter(n => !!n.approvalRequested && !n.published);
      }
    } else {
      return notesToFilter.filter(note => (showPublished ? note.published : !note.published));
    }
  }, [personalNotes, studentNotes, showPublished, viewMode, isSearching, searchResults]);

  // Update selected note when it changes in studentNotes (for instructor review mode)
  useEffect(() => {
    if (viewMode === 'review' && studentNotes.length > 0) {
      const selectedNoteId = useNotesStore.getState().selectedNoteId;
      if (selectedNoteId) {
        const updatedNote = studentNotes.find(n => {
          const noteId = n.id;
          return noteId === selectedNoteId;
        });

        if (updatedNote) {
          onNoteSelect(updatedNote, false);
        }
      }
    }
  }, [studentNotes, viewMode, onNoteSelect]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const notesToSearch = viewMode === 'review' ? studentNotes : personalNotes;
    const filtered = notesToSearch.filter(note => {
      const matchesText =
        note.title.toLowerCase().includes(query) ||
        (note.tags &&
          Array.isArray(note.tags) &&
          note.tags.some(tag => tag.label.toLowerCase().includes(query)));

      if (!matchesText) return false;

      if (viewMode === 'review') {
        if (showPublished) {
          return !!note.published;
        } else {
          return !!note.approvalRequested && !note.published;
        }
      }

      return showPublished ? !!note.published : !note.published;
    });
    setSearchResults(filtered);
  };

  const togglePublished = (value: string) => {
    const newShowPublished = value === 'published';
    setShowPublished(newShowPublished);
    setIsSearching(false);
    setSearchResults(null);
  };

  return (
    <div className='relative z-10 flex h-full min-w-[280px] flex-col border-r border-gray-200 bg-gray-50'>
      <div className='flex-1 overflow-y-auto p-4 pb-20'>
        <div className='w-full'>
          <SearchBarNote onSearch={handleSearch} />

          <div className='mt-2 flex flex-row items-center justify-between pt-1 text-center'>
            <Tabs
              defaultValue={viewMode === 'review' ? 'unpublished' : 'unpublished'}
              className='w-full'
              onValueChange={togglePublished}
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='unpublished' className='text-sm font-semibold'>
                  {viewMode === 'review' ? 'Unreviewed' : 'Unpublished'}
                </TabsTrigger>
                <TabsTrigger value='published' className='text-sm font-semibold'>
                  {viewMode === 'review' ? 'Reviewed' : 'Published'}
                </TabsTrigger>
              </TabsList>
              <TabsContent value='unpublished'></TabsContent>
              <TabsContent value='published'></TabsContent>
            </Tabs>
          </div>
        </div>
        <div>
          <NoteListView
            notes={filteredNotes}
            onNoteSelect={note => onNoteSelect(note, false)}
            isSearching={isSearching}
            viewMode={viewMode}
            isInstructor={isInstructor}
          />
        </div>
      </div>

      {viewMode !== 'review' && (
        <div className='absolute bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-gray-50 p-4'>
          <Button
            id='add-note-button'
            data-testid='add-note-button'
            onClick={handleAddNote}
            disabled={isCreatingNote}
            className='w-full rounded-lg bg-blue-600 font-medium text-white shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-70'
          >
            {isCreatingNote ?
              <>
                <Loader2 size={18} className='mr-2 animate-spin' />
                Creating...
              </>
            : <>
                <Plus size={18} className='mr-2' />
                New Note
              </>
            }
          </Button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
