import { useState } from 'react';
import Sidebar from '@/app/lib/components/Sidebar';
import NoteEditor from '@/app/lib/components/NoteEditor';
import { Note, newNote } from '@/app/types';
import { useNotesStore } from '@/app/lib/stores/notesStore';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useQueryClient } from '@tanstack/react-query';
import { notesKeys } from '../lib/hooks/queries/useNotes';

export default function Notes() {
  const { setSelectedNoteId } = useNotesStore(
    useShallow(state => ({
      setSelectedNoteId: state.setSelectedNoteId,
    })),
  );

  const { user, isLoggedIn } = useAuthStore(
    useShallow(state => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
    })),
  );

  const queryClient = useQueryClient();

  const [selectedNote, setSelectedNote] = useState<Note | newNote>();
  const [isNewNote, setIsNewNote] = useState(false);

  const handleNoteSelect = (note: Note | newNote, isNew: boolean) => {
    setSelectedNote(note);
    setIsNewNote(isNew);
  };

  const handleNoteDeleted = () => {
    const userId = user?.id ?? '';
    const currentNotes = queryClient.getQueryData<Note[]>(notesKeys.personal(userId)) ?? [];
    setSelectedNote(currentNotes[0] || undefined);
    setSelectedNoteId(currentNotes[0]?.id || null);

    // Reconcile cache with server to recover if the optimistic removal failed
    queryClient.invalidateQueries({ queryKey: notesKeys.personal(userId) });
  };

  return (
    <div className='flex h-full'>
      <div className='w-[300px] shrink-0 border-r border-gray-200'>
        <Sidebar onNoteSelect={handleNoteSelect} />
      </div>
      <div className='relative flex min-w-0 flex-1 flex-col'>
        {isLoggedIn ?
          selectedNote ?
            <NoteEditor
              key={selectedNote && 'id' in selectedNote ? selectedNote.id : 'new'}
              note={selectedNote}
              isNewNote={isNewNote}
              onNoteDeleted={handleNoteDeleted}
            />
          : <div className='flex h-full w-full items-center justify-center bg-gray-100'>
              <div className='flex max-w-md flex-col items-center rounded-sm bg-white px-12 py-16 text-center shadow-sm'>
                <h2 className='mb-2 text-2xl font-semibold text-gray-800'>No note selected</h2>
                <p className='text-sm text-gray-500'>
                  Select a note from the sidebar to start editing, or create a new one.
                </p>
              </div>
            </div>

        : <div className='flex h-full w-full items-center justify-center bg-gray-100'>
            <div className='flex max-w-md flex-col items-center rounded-sm bg-white px-12 py-16 text-center shadow-sm'>
              <h2 className='mb-3 text-2xl font-semibold text-gray-800'>Sign in to get started</h2>
              <p className='mb-6 text-sm text-gray-500'>
                You must be logged in to create and edit notes.
              </p>
              <button
                onClick={() => (window.location.href = '/login')}
                className='rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700'
              >
                Sign in
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}
