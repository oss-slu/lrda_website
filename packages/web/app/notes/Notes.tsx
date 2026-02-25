'use client';
import { useState } from 'react';
import Sidebar from '../lib/components/Sidebar';
import NoteEditor from '../lib/components/NoteEditor';
import { Note, newNote } from '@/app/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useNotesStore } from '../lib/stores/notesStore';
import { useAuthStore } from '../lib/stores/authStore';
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
    const userId = user?.uid ?? '';
    const currentNotes = queryClient.getQueryData<Note[]>(notesKeys.personal(userId)) ?? [];
    setSelectedNote(currentNotes[0] || undefined);
    setSelectedNoteId(currentNotes[0]?.id || null);

    // Reconcile cache with server to recover if the optimistic removal failed
    queryClient.invalidateQueries({ queryKey: notesKeys.personal(userId) });
  };

  return (
    <ResizablePanelGroup direction='horizontal' autoSaveId='notes-layout'>
      <ResizablePanel
        minSize={22}
        maxSize={30}
        defaultSize={26}
        collapsible={true}
        collapsedSize={1}
      >
        <Sidebar onNoteSelect={handleNoteSelect} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        {/* Main content area */}
        <div className='relative flex h-full min-h-0 flex-col'>
          {isLoggedIn ?
            selectedNote ?
              <div className='flex h-full min-h-0 w-full flex-col'>
                <NoteEditor
                  note={selectedNote}
                  isNewNote={isNewNote}
                  onNoteDeleted={handleNoteDeleted}
                />
              </div>
            : <div className='flex h-full w-full flex-col items-center justify-center text-3xl font-bold'>
                <div className='mb-10'>Please select a note to start editing or add a new one!</div>
              </div>

          : <div className='flex h-full w-full flex-col items-center justify-center text-3xl font-bold'>
              <div className='mb-10'>You must be logged in to create notes!</div>
              <button
                onClick={() => (window.location.href = '/login')}
                className='rounded border border-blue-700 bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-700'
              >
                Login Here
              </button>
            </div>
          }
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
