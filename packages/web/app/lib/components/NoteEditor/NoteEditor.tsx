'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { RichTextEditorRef } from 'mui-tiptap';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useNotesStore } from '@/app/lib/stores/notesStore';
import { useShallow } from 'zustand/react/shallow';
import { notesService, instructorService } from '@/app/lib/services';
import { Note, newNote } from '@/app/types';

import useNoteState from './hooks/useNoteState';
import { useNotePermissions } from './hooks/useNotePermissions';
import { useNoteSync } from './hooks/useNoteSync';
import { useAutoSave } from './hooks/useAutoSave';
import { useCommentBubble } from './hooks/useCommentBubble';
import { useIntroTour } from './hooks/useIntroTour';
import { handleDeleteNote as handleArchiveNote } from './handlers/noteHandlers';

import NoteEditorHeader from './NoteEditorHeader';
import NoteEditorToolbar from './NoteEditorToolbar';
import NoteEditorContent from './NoteEditorContent';
import { CommentSidebarPanel, CommentToggleButton } from './NoteEditorComments';

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
  onNoteDeleted?: () => void;
};

// Generate a stable session ID for new notes
let newNoteSessionCounter = 0;

export default function NoteEditor({
  note: initialNote,
  isNewNote,
  onNoteDeleted,
}: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);

  // Stable editor session key - only changes when switching to a different note
  // This prevents the editor from remounting when a draft is saved
  const initialNoteId = initialNote && 'id' in initialNote ? initialNote.id : undefined;
  const editorSessionKey = useMemo(() => {
    if (initialNoteId) {
      return `note-${initialNoteId}`;
    }
    // For new notes, generate a stable session ID that persists through the save
    return `new-${++newNoteSessionCounter}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNoteId ?? (isNewNote ? 'new' : 'unknown')]);

  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  const updateNote = useNotesStore(state => state.updateNote);

  // Refs
  const rteRef = useRef<RichTextEditorRef>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const lastEditTimeRef = useRef<number>(Date.now());

  // State
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState<boolean>(false);
  const [isAnyPopupOpen, setIsAnyPopupOpen] = useState<boolean>(false);

  // Hooks
  const { userId, instructorId, isViewingStudentNote, isStudentViewingOwnNote, canComment } =
    useNotePermissions(noteState.note);

  useNoteSync({
    noteState,
    noteHandlers,
    initialNote,
    rteRef,
    lastEditTimeRef,
  });

  const { isSaving } = useAutoSave({
    noteState,
    noteHandlers,
    isNewNote,
    isViewingStudentNote,
    authUserId: authUser?.uid,
    lastEditTimeRef,
  });

  const { showCommentBubble, commentBubblePosition, setShowCommentBubble } = useCommentBubble({
    rteRef,
    canComment,
    isViewingStudentNote,
    isStudentViewingOwnNote,
  });

  useIntroTour({
    titleRef,
    deleteRef,
    dateRef,
    locationRef,
  });

  // Popup detection effect
  useEffect(() => {
    const checkForOpenPopups = () => {
      const locationMapOverlay = document.querySelector('.fixed.inset-0.z-50, .fixed.inset-0.z-40');
      const openPopovers = document.querySelectorAll('[data-state="open"]');
      const openDialogs = document.querySelectorAll('[role="alertdialog"][data-state="open"]');

      const hasOpenPopup = !!(
        locationMapOverlay ||
        openPopovers.length > 0 ||
        openDialogs.length > 0
      );
      setIsAnyPopupOpen(hasOpenPopup);

      if (hasOpenPopup && showCommentBubble) {
        setShowCommentBubble(false);
      }
    };

    checkForOpenPopups();

    const observer = new MutationObserver(() => {
      checkForOpenPopups();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'class', 'role'],
    });

    const interval = setInterval(checkForOpenPopups, 200);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [showCommentBubble, setShowCommentBubble]);

  // Handlers
  const handleRequestApprovalClick = async () => {
    try {
      const updatedApprovalStatus = !noteState.approvalRequested;

      const updatedNote: any = {
        ...noteState.note,
        text: noteState.editorContent,
        title: noteState.title,
        media: [...noteState.images, ...noteState.videos],
        time: noteState.time,
        longitude: noteState.longitude,
        latitude: noteState.latitude,
        tags: noteState.tags,
        audio: noteState.audio,
        id: noteState.note?.id || '',
        creator: noteState.note?.creator || authUser?.uid,
        approvalRequested: updatedApprovalStatus,
        instructorId: instructorId || null,
        published: false,
      };

      await notesService.update(updatedNote);

      if (updatedApprovalStatus && instructorId) {
        await instructorService.requestApproval({
          instructorId: instructorId,
          title: updatedNote.title || '',
          text: updatedNote.text || '',
          creator: updatedNote.creator || '',
          noteId: updatedNote.id || '',
          time: updatedNote.time || new Date(),
          latitude: updatedNote.latitude || '',
          longitude: updatedNote.longitude || '',
          tags: updatedNote.tags || [],
          media: updatedNote.media || [],
          audio: updatedNote.audio || [],
          approvalRequested: true,
        });
      }

      noteHandlers.setApprovalRequested(updatedApprovalStatus);

      toast(updatedApprovalStatus ? 'Approval Requested' : 'Approval Request Canceled', {
        description:
          updatedApprovalStatus ?
            'Your note has been submitted for instructor approval.'
          : 'Your approval request has been canceled.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error requesting approval:', error);
      toast('Error', {
        description: 'Failed to request approval. Please try again later.',
      });
    }
  };

  const handlePublishClick = async () => {
    const creatorId = noteState.note?.creator || authUser?.uid;
    const roles = authUser?.roles;
    const isStudentRole = !!roles?.contributor && !roles?.administrator;

    const updatedNote: any = {
      ...noteState.note,
      text: noteState.editorContent,
      title: noteState.title,
      media: [...noteState.images, ...noteState.videos],
      time: noteState.time,
      longitude: noteState.longitude,
      latitude: noteState.latitude,
      tags: noteState.tags,
      audio: noteState.audio,
      id: noteState.note?.id || '',
      uid: noteState.note?.uid ?? '',
      creator: creatorId || '',
      published: !noteState.isPublished,
      approvalRequested: isStudentRole ? false : noteState.approvalRequested,
    };

    try {
      await notesService.update(updatedNote);

      noteHandlers.setIsPublished(updatedNote.published);
      noteHandlers.setApprovalRequested(updatedNote.approvalRequested);
      noteHandlers.setNote(updatedNote);

      toast(updatedNote.published ? 'Note Published' : 'Note Unpublished', {
        description:
          updatedNote.published ?
            'Your note has been published successfully.'
          : 'Your note has been unpublished successfully.',
        duration: 4000,
      });

      noteHandlers.setCounter(prevCounter => prevCounter + 1);
    } catch (error) {
      console.error('Error updating note state:', error);
      toast('Error', {
        description: 'Failed to update note state. Please try again later.',
        duration: 4000,
      });
    }
  };

  const handleDeleteNote = async (): Promise<boolean> => {
    try {
      const creatorId = noteState.note?.creator || authUser?.uid;

      const updatedNote = {
        ...noteState.note,
        text: noteState.editorContent,
        title: noteState.title,
        media: [...noteState.images, ...noteState.videos],
        time: noteState.time,
        longitude: noteState.longitude,
        latitude: noteState.latitude,
        tags: noteState.tags,
        audio: noteState.audio,
        id: noteState.note?.id || '',
        uid: noteState.note?.uid ?? '',
        creator: creatorId || '',
        published: false,
        isArchived: true,
      };

      if (noteState.note?.id) {
        updateNote(noteState.note.id, {
          isArchived: true,
        });
      }

      noteHandlers.setNote(updatedNote);

      return await handleArchiveNote(updatedNote, noteHandlers.setNote);
    } catch (error) {
      console.error('Error updating note state:', error);
      toast('Error', {
        description: 'Failed to update note state. Please try again later.',
        duration: 4000,
      });
    }
    return false;
  };

  const handleEdit = () => {
    lastEditTimeRef.current = Date.now();
  };

  // Panel group key for layout
  const panelGroupKey = `${noteState.note?.id || 'new'}-${
    canComment && isCommentSidebarOpen && (isViewingStudentNote || isStudentViewingOwnNote) ?
      'open'
    : 'closed'
  }`;

  const showCommentSidebar =
    !!noteState.note?.id &&
    canComment &&
    isCommentSidebarOpen &&
    (isViewingStudentNote || isStudentViewingOwnNote);

  return (
    <>
      <div className='relative h-full min-h-0 w-full bg-white transition-all duration-300 ease-in-out'>
        <ResizablePanelGroup key={panelGroupKey} direction='horizontal' className='h-full w-full'>
          <ResizablePanel
            defaultSize={showCommentSidebar ? 70 : 100}
            minSize={45}
            maxSize={showCommentSidebar ? 85 : 100}
            className='flex min-w-[420px] flex-col transition-[flex-basis] duration-200 ease-out'
          >
            <ScrollArea className='flex h-full min-h-0 w-full flex-col'>
              <div aria-label='Top Bar' className='flex w-full flex-col px-8 pt-8'>
                <NoteEditorHeader
                  noteState={noteState}
                  noteHandlers={noteHandlers}
                  isSaving={isSaving}
                  isViewingStudentNote={isViewingStudentNote}
                  userId={userId}
                  instructorId={instructorId}
                  onPublishClick={handlePublishClick}
                  onRequestApprovalClick={handleRequestApprovalClick}
                  onDeleteNote={handleDeleteNote}
                  onNoteDeleted={onNoteDeleted}
                  onTitleChange={handleEdit}
                  titleRef={titleRef}
                  deleteRef={deleteRef}
                />

                <div className='-mt-4 flex flex-row items-center gap-4 pb-4'>
                  <NoteEditorToolbar
                    noteState={noteState}
                    noteHandlers={noteHandlers}
                    isViewingStudentNote={isViewingStudentNote}
                    onLocationChange={handleEdit}
                    onTimeChange={handleEdit}
                    dateRef={dateRef}
                    locationRef={locationRef}
                  />
                </div>

                <NoteEditorContent
                  noteState={noteState}
                  noteHandlers={noteHandlers}
                  rteRef={rteRef}
                  editorSessionKey={editorSessionKey}
                  isViewingStudentNote={isViewingStudentNote}
                  canComment={canComment}
                  isStudentViewingOwnNote={isStudentViewingOwnNote}
                  showCommentBubble={showCommentBubble}
                  commentBubblePosition={commentBubblePosition}
                  onCommentBubbleClick={() => {
                    setIsCommentSidebarOpen(true);
                    setShowCommentBubble(false);
                  }}
                  onEdit={handleEdit}
                />
              </div>
            </ScrollArea>
          </ResizablePanel>

          {showCommentSidebar && (
            <CommentSidebarPanel noteId={noteState.note?.id as string} rteRef={rteRef} />
          )}
        </ResizablePanelGroup>
      </div>

      <CommentToggleButton
        noteId={noteState.note?.id || ''}
        isCommentSidebarOpen={isCommentSidebarOpen}
        setIsCommentSidebarOpen={setIsCommentSidebarOpen}
        canComment={canComment}
        isViewingStudentNote={isViewingStudentNote}
        isStudentViewingOwnNote={isStudentViewingOwnNote}
        isAnyPopupOpen={isAnyPopupOpen}
        rteRef={rteRef}
      />
    </>
  );
}
