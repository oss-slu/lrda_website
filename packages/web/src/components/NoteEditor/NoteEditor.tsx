import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import { RichTextEditorProvider } from 'mui-tiptap';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const emotionCache = createCache({ key: 'css' });
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileX2, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { useNoteEditorStore } from '@/stores/noteEditorStore';
import { useShallow } from 'zustand/react/shallow';
import { useQueryClient } from '@tanstack/react-query';
import { notesKeys } from '@/hooks/queries/useNotes';
import { notesService } from '@/services';
import { Note } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import useExtensions from '@/utils/use_extensions';
import { useNotePermissions } from './hooks/useNotePermissions';
import { useNoteSync } from './hooks/useNoteSync';
import { useAutoSave } from './hooks/useAutoSave';
import { useIntroTour } from './hooks/useIntroTour';

import NoteEditorHeader from './NoteEditorHeader';
import NoteEditorToolbar from './NoteEditorToolbar';
import NoteEditorContent from './NoteEditorContent';
import EditorMenuControls from '../editor_menu_controls';
import AutoSaveIndicator from './AutoSaveIndicator';
import PublishToggle from './NoteElements/PublishToggle';
import { CommentSidebarPanel } from './NoteEditorComments';

type NoteEditorProps = {
  isNewNote?: boolean;
  onNoteDeleted?: () => void;
};

function buildNotePayload(authUserId: string | undefined, overrides: Partial<Note> = {}): Note {
  const s = useNoteEditorStore.getState();
  return {
    ...s.note!,
    text: s.editorContent,
    title: s.title,
    media: [...s.images, ...s.videos],
    time: s.time,
    longitude: s.longitude,
    latitude: s.latitude,
    tags: s.tags,
    audio: s.audio,
    id: s.note?.id || '',
    uid: s.note?.uid ?? '',
    creator: s.note?.creator || authUserId || '',
    ...overrides,
  };
}

export default function NoteEditor({
  onNoteDeleted,
}: NoteEditorProps) {
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  const queryClient = useQueryClient();

  const noteId = useNoteEditorStore(s => s.note?.id);
  const isSaving = useNoteEditorStore(s => s.isSaving);
  const isPublished = useNoteEditorStore(s => s.isPublished);
  const approvalRequested = useNoteEditorStore(s => s.approvalRequested);
  const isReturned = useNoteEditorStore(s => s.isReturned);

  const titleRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);

  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState(false);

  const extensions = useExtensions({
    placeholder: 'Add your own content here...',
  });

  const {
    userId,
    instructorId,
    isInstructorUser,
    isViewingStudentNote,
    isStudentViewingOwnNote,
    canComment,
  } = useNotePermissions();

  const editorContent = useNoteEditorStore(s => s.editorContent);

  const editor = useEditor({
    extensions,
    content: editorContent,
    immediatelyRender: false,
    editable: !isViewingStudentNote,
    onUpdate: ({ editor: ed }) => {
      if (!isViewingStudentNote) {
        const store = useNoteEditorStore.getState();
        store.setEditorContent(ed.getHTML());
        store.markEdited();
      }
    },
  });

  useEffect(() => {
    if (editor && !isViewingStudentNote) {
      requestAnimationFrame(() => {
        const { doc } = editor.state;
        const found = { pos: -1 };
        doc.descendants((node, pos) => {
          if (found.pos >= 0) return false;
          if (node.isTextblock) {
            found.pos = pos + 1;
            return false;
          }
          return true;
        });
        if (found.pos >= 0) {
          editor.commands.focus(found.pos);
        }
      });
    }
  }, [editor, isViewingStudentNote]);

  useNoteSync(editor);

  useAutoSave(isViewingStudentNote);

  useIntroTour({
    titleRef,
    deleteRef,
    dateRef,
    locationRef,
  });

  const handleMediaUpload = (media: { type: 'image' | 'video' | 'audio'; uri: string }) => {
    const store = useNoteEditorStore.getState();
    if (media.type === 'image') {
      editor
        ?.chain()
        .focus()
        .setImage({ src: media.uri, alt: 'Image description', width: 100 })
        .run();
      store.addImage({ type: 'image', uuid: uuidv4(), uri: media.uri });
    } else if (media.type === 'video') {
      const video = {
        type: 'video' as const,
        uuid: uuidv4(),
        uri: media.uri,
        thumbnail: '',
        duration: '0:00',
      };
      store.addVideo(video);
      editor?.chain().focus().setVideo({ src: media.uri }).run();
    } else {
      const audioItem = {
        type: 'audio' as const,
        uuid: uuidv4(),
        uri: media.uri,
        duration: '0:00',
        name: `Audio ${store.audio.length + 1}`,
      };
      store.addAudio(audioItem);
      editor?.chain().focus().setAudio({ src: media.uri, title: audioItem.name }).run();
    }
    store.markEdited();
  };

  const handleRequestApprovalClick = async () => {
    const store = useNoteEditorStore.getState();
    const updatedApprovalStatus = !store.approvalRequested;

    const updatedNote = buildNotePayload(authUser?.id, {
      approvalRequested: updatedApprovalStatus,
      published: false,
      isReturned: false,
    });

    try {
      await notesService.update(updatedNote);

      store.setApprovalRequested(updatedApprovalStatus);
      store.setIsReturned(false);
      store.markEdited();

      queryClient.invalidateQueries({ queryKey: notesKeys.all });

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
    const store = useNoteEditorStore.getState();
    const updatedNote = buildNotePayload(authUser?.id, {
      published: !store.isPublished,
      approvalRequested: !isInstructorUser ? false : store.approvalRequested,
    });

    try {
      await notesService.update(updatedNote);

      store.setIsPublished(updatedNote.published ?? false);
      store.setApprovalRequested(updatedNote.approvalRequested ?? false);
      store.setNote(updatedNote);
      store.markEdited();

      queryClient.invalidateQueries({ queryKey: notesKeys.all });

      toast(updatedNote.published ? 'Note Published' : 'Note Unpublished', {
        description:
          updatedNote.published ?
            'Your note has been published successfully.'
          : 'Your note has been unpublished successfully.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Error updating note state:', error);
      toast('Error', {
        description: 'Failed to update note state. Please try again later.',
        duration: 4000,
      });
    }
  };

  const handleDeleteNote = async (): Promise<boolean> => {
    const store = useNoteEditorStore.getState();
    const noteId = store.note?.id;
    const creatorId = store.note?.creator || authUser?.id;

    if (!noteId) {
      toast('Error', {
        description: "This note hasn't been saved yet. Please wait a moment and try again.",
        duration: 4000,
      });
      return false;
    }

    const cacheKey = notesKeys.personal(creatorId ?? '');
    const previousNotes = queryClient.getQueryData<Note[]>(cacheKey);

    try {
      if (creatorId) {
        queryClient.setQueryData<Note[]>(cacheKey, old =>
          old ? old.filter(n => n.id !== noteId) : [],
        );
      }

      await notesService.delete(noteId);
      queryClient.invalidateQueries({ queryKey: notesKeys.all });

      toast('Note Deleted', {
        description: 'Your note has been permanently deleted.',
        duration: 4000,
      });
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      queryClient.setQueryData(cacheKey, previousNotes);
      toast('Error', {
        description: 'Failed to delete note. Please try again later.',
        duration: 4000,
      });
      return false;
    }
  };

  return (
    <CacheProvider value={emotionCache}>
      <RichTextEditorProvider editor={editor}>
        <div className='flex h-full min-h-0 w-full flex-col'>
          {/* Toolbar */}
          <div className='shrink-0 border-b border-gray-200 bg-white'>
            {/* Row 1: Metadata + actions */}
            <div className='flex items-center gap-1 px-3 py-1.5'>
              <NoteEditorToolbar
                isViewingStudentNote={isViewingStudentNote}
                dateRef={dateRef}
                locationRef={locationRef}
              />

              <div className='ml-auto flex shrink-0 items-center gap-2'>
                {!isViewingStudentNote && (
                  <>
                    <AutoSaveIndicator />

                    <div className='mx-1 h-5 w-px bg-gray-300' aria-hidden='true' />

                    <PublishToggle
                      id='publish-toggle-button'
                      isPublished={Boolean(isPublished)}
                      isApprovalRequested={approvalRequested || false}
                      isReturned={isReturned || false}
                      noteId={noteId || ''}
                      userId={userId}
                      instructorId={instructorId}
                      onPublishClick={handlePublishClick}
                      onRequestApprovalClick={handleRequestApprovalClick}
                      isInstructorReview={isViewingStudentNote}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={!noteId || isSaving}
                          className='inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                          title={
                            !noteId ?
                              'Please wait for note to save before deleting'
                            : 'Delete this note'
                          }
                          ref={deleteRef}
                        >
                          <FileX2 className='h-4 w-4' />
                          <span>Delete</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this note.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              const success = await handleDeleteNote();
                              if (success && onNoteDeleted) {
                                onNoteDeleted();
                              }
                            }}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}

                {noteId && canComment && (isViewingStudentNote || isStudentViewingOwnNote) && (
                  <>
                    <div className='mx-1 h-5 w-px bg-gray-300' aria-hidden='true' />
                    <button
                      onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        isCommentSidebarOpen ?
                          'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-label={isCommentSidebarOpen ? 'Close comments' : 'Open comments'}
                    >
                      {isCommentSidebarOpen ?
                        <X className='h-4 w-4' />
                      : <MessageSquare className='h-4 w-4' />}
                      <span>{isCommentSidebarOpen ? 'Close' : 'Comments'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Row 2: Formatting controls */}
            {!isViewingStudentNote && (
              <div className='overflow-x-auto border-t border-gray-100 px-3 py-1'>
                <EditorMenuControls onMediaUpload={handleMediaUpload} />
              </div>
            )}
          </div>

          {/* Scrollable content area */}
          <div className='relative flex min-h-0 flex-1'>
            <ScrollArea className='min-w-0 flex-1 bg-gray-100'>
              {/* Centered white canvas */}
              <div className='mx-auto my-8 max-w-3xl rounded-sm bg-white px-12 py-10 shadow-sm'>
                <NoteEditorHeader
                  isViewingStudentNote={isViewingStudentNote}
                  titleRef={titleRef}
                />

                <NoteEditorContent
                  editor={editor}
                  isViewingStudentNote={isViewingStudentNote}
                />
              </div>
            </ScrollArea>

            {!!noteId && canComment && (isViewingStudentNote || isStudentViewingOwnNote) && (
              <CommentSidebarPanel
                noteId={noteId}
                editor={editor}
                isInstructor={isInstructorUser}
                canComment={canComment}
                isOpen={isCommentSidebarOpen}
              />
            )}
          </div>
        </div>
      </RichTextEditorProvider>
    </CacheProvider>
  );
}
