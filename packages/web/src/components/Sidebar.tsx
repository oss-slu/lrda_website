import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import SearchBarNote from './search_bar_note';
import NoteListView from './note_listview';
import { Note, newNote } from '@/types';
import { useNotesStore } from '@/stores/notesStore';
import { useAuthStore } from '@/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { notesService } from '@/services';
import { usePersonalNotes, notesKeys } from '@/hooks/queries/useNotes';
import { useQueryClient } from '@tanstack/react-query';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SidebarProps = {
  onNoteSelect: (note: Note | newNote, isNewNote: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onNoteSelect }) => {
  const { setSelectedNoteId } = useNotesStore(
    useShallow(state => ({
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

  // TanStack Query for personal notes.
  // Gate on isInitialized so the API call doesn't fire before the session
  // cookie is re-validated on page refresh. Without this, the API treats
  // the user as anonymous and returns only published notes.
  const { data: personalNotes = [] } = usePersonalNotes(isInitialized ? (user?.id ?? null) : null);

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
        latitude: null,
        longitude: null,
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

  // Derive filteredNotes from source data
  const filteredNotes = useMemo(() => {
    if (isSearching && searchResults !== null) {
      return searchResults;
    }

    return personalNotes.filter(note => (showPublished ? note.published : !note.published));
  }, [personalNotes, showPublished, isSearching, searchResults]);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const filtered = personalNotes.filter(note => {
      const matchesText =
        note.title.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.label.toLowerCase().includes(query));

      if (!matchesText) return false;

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
            <Tabs defaultValue='unpublished' className='w-full' onValueChange={togglePublished}>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='unpublished' className='text-sm font-semibold'>
                  Unpublished
                </TabsTrigger>
                <TabsTrigger value='published' className='text-sm font-semibold'>
                  Published
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
          />
        </div>
      </div>

      <div className='absolute right-0 bottom-0 left-0 z-10 border-t border-gray-200 bg-gray-50 p-4'>
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
    </div>
  );
};

export default Sidebar;
