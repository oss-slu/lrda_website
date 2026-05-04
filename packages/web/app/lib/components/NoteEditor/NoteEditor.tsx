import { useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import { RichTextEditorProvider } from 'mui-tiptap';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const emotionCache = createCache({ key: 'css' });
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileX2, MessageSquare, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useQueryClient } from '@tanstack/react-query';
import { notesKeys } from '@/app/lib/hooks/queries/useNotes';
import { notesService } from '@/app/lib/services';
import { Note, newNote } from '@/app/types';
import type { PhotoMedia, VideoMedia, AudioMedia } from '@/app/types';
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

import useExtensions from '@/app/lib/utils/use_extensions';
import useNoteState from './hooks/useNoteState';
import { useNotePermissions } from './hooks/useNotePermissions';
import { useNoteSync } from './hooks/useNoteSync';
import { useAutoSave } from './hooks/useAutoSave';
import { useIntroTour } from './hooks/useIntroTour';
import { handleEditorChange } from './handlers/noteHandlers';

import NoteEditorHeader from './NoteEditorHeader';
import NoteEditorToolbar from './NoteEditorToolbar';
import NoteEditorContent from './NoteEditorContent';
import EditorMenuControls from '../editor_menu_controls';
import AutoSaveIndicator from './AutoSaveIndicator';
import PublishToggle from './NoteElements/PublishToggle';
import { CommentSidebarPanel } from './NoteEditorComments';
import { WritingAssistantSidebarPanel } from './WritingAssistantSidebar';

type NoteEditorProps = {
  note?: Note | newNote;
  isNewNote: boolean;
  onNoteDeleted?: () => void;
};

export default function NoteEditor({
  note: initialNote,
  isNewNote,
  onNoteDeleted,
}: NoteEditorProps) {
  const { noteState, noteHandlers } = useNoteState(initialNote as Note);

  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  const queryClient = useQueryClient();

  // Refs
  const titleRef = useRef<HTMLInputElement | null>(null);
  const dateRef = useRef<HTMLDivElement | null>(null);
  const deleteRef = useRef<HTMLButtonElement | null>(null);
  const locationRef = useRef<HTMLDivElement | null>(null);
  const lastEditTimeRef = useRef<number>(0);

  // State
  const [isWritingAssistantOpen, setIsWritingAssistantOpen] = useState<boolean>(false);
  const [isCommentSidebarOpen, setIsCommentSidebarOpen] = useState<boolean>(false);

  // Editor setup
  const extensions = useExtensions({
    placeholder: 'Add your own content here...',
  });

  const noteId = initialNote && 'id' in initialNote ? initialNote.id : undefined;

  // Hooks
  const {
    userId,
    instructorId,
    isInstructorUser,
    isViewingStudentNote,
    isStudentViewingOwnNote,
    canComment,
  } = useNotePermissions(noteState.note);

  const editor = useEditor({
    extensions,
    content: noteState.editorContent,
    immediatelyRender: false,
    editable: !isViewingStudentNote,
    onUpdate: ({ editor: ed }) => {
      if (!isViewingStudentNote) {
        lastEditTimeRef.current = Date.now();
        handleEditorChange(noteHandlers.setEditorContent, ed.getHTML());
      }
    },
  });

  useNoteSync({
    noteState,
    noteHandlers,
    initialNote,
    editor,
    lastEditTimeRef,
  });

  const { isSaving, lastSavedAt } = useAutoSave({
    noteState,
    noteHandlers,
    isNewNote,
    isViewingStudentNote,
    authUserId: authUser?.id,
    lastEditTimeRef,
  });

  useIntroTour({
    titleRef,
    deleteRef,
    dateRef,
    locationRef,
  });

  // Media upload handler
  const handleMediaUpload = (media: { type: 'image' | 'video' | 'audio'; uri: string }) => {
    if (media.type === 'image') {
      if (editor) {
        editor
          .chain()
          .focus()
          .setImage({ src: media.uri, alt: 'Image description', width: 100 })
          .run();
      }
      const photo: PhotoMedia = { type: 'image', uuid: uuidv4(), uri: media.uri };
      noteHandlers.setImages(prevImages => [...prevImages, photo]);
    } else if (media.type === 'video') {
      const newVideo: VideoMedia = {
        type: 'video',
        uuid: uuidv4(),
        uri: media.uri,
        thumbnail: '',
        duration: '0:00',
      };
      noteHandlers.setVideos(prevVideos => [...prevVideos, newVideo]);
      if (editor) {
        const videoLink = `Video ${noteState.videos.length + 1}`;
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              const endPos = tr.doc.content.size;
              const paragraphNodeForNewLine = editor.schema.node('paragraph');
              const linkMark = editor.schema.marks.link;
              const textNode = editor.schema.text(
                videoLink,
                linkMark ? [linkMark.create({ href: media.uri })] : [],
              );
              const paragraphNodeForLink = editor.schema.node('paragraph', null, [textNode]);
              const transaction = tr
                .insert(endPos, paragraphNodeForNewLine)
                .insert(endPos + 1, paragraphNodeForLink);
              dispatch(transaction);
            }
            return true;
          })
          .run();
      }
    } else if (media.type === 'audio') {
      const newAudio: AudioMedia = {
        type: 'audio',
        uuid: uuidv4(),
        uri: media.uri,
        duration: '0:00',
        name: `Audio Note ${noteState.audio.length + 1}`,
      };
      noteHandlers.setAudio(prevAudio => [...prevAudio, newAudio]);
    }
  };

  // Helpers
  const buildNotePayload = (overrides: Partial<Note> = {}): Note => ({
    ...noteState.note!,
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
    creator: noteState.note?.creator || authUser?.id || '',
    ...overrides,
  });

  // Handlers
  const handleRequestApprovalClick = async () => {
    try {
      const updatedApprovalStatus = !noteState.approvalRequested;

      const updatedNote = buildNotePayload({
        approvalRequested: updatedApprovalStatus,
        published: false,
        isReturned: false,
      });

      await notesService.update(updatedNote);

      noteHandlers.setApprovalRequested(updatedApprovalStatus);
      noteHandlers.setIsReturned(false);
      lastEditTimeRef.current = Date.now();

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
    const updatedNote = buildNotePayload({
      published: !noteState.isPublished,
      approvalRequested: !isInstructorUser ? false : noteState.approvalRequested,
    });

    try {
      await notesService.update(updatedNote);

      noteHandlers.setIsPublished(updatedNote.published ?? false);
      noteHandlers.setApprovalRequested(updatedNote.approvalRequested ?? false);
      noteHandlers.setNote(updatedNote);
      lastEditTimeRef.current = Date.now();

      queryClient.invalidateQueries({ queryKey: notesKeys.all });

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
    const noteId = noteState.note?.id;
    const creatorId = noteState.note?.creator || authUser?.id;

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

  const handleEdit = () => {
    lastEditTimeRef.current = Date.now();
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
                noteState={noteState}
                noteHandlers={noteHandlers}
                isViewingStudentNote={isViewingStudentNote}
                onLocationChange={handleEdit}
                onTimeChange={handleEdit}
                dateRef={dateRef}
                locationRef={locationRef}
              />

              <div className='ml-auto flex shrink-0 items-center gap-2'>
                {!isViewingStudentNote && (
                  <>
                    <AutoSaveIndicator isSaving={isSaving} lastSavedAt={lastSavedAt} />

                    <div className='mx-1 h-5 w-px bg-gray-300' aria-hidden='true' />

                    <PublishToggle
                      id='publish-toggle-button'
                      isPublished={Boolean(noteState.isPublished)}
                      isApprovalRequested={noteState.approvalRequested || false}
                      isReturned={noteState.isReturned || false}
                      noteId={noteState.note?.id || ''}
                      userId={userId}
                      instructorId={instructorId}
                      onPublishClick={handlePublishClick}
                      onRequestApprovalClick={handleRequestApprovalClick}
                      isInstructorReview={isViewingStudentNote}
                    />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={!noteState.note?.id || isSaving}
                          className='inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                          title={
                            !noteState.note?.id ?
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

                {!isViewingStudentNote && (
                  <>
                    <div className='mx-1 h-5 w-px bg-gray-300' aria-hidden='true' />
                    <button
                      onClick={() => setIsWritingAssistantOpen(!isWritingAssistantOpen)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                        isWritingAssistantOpen ?
                          'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-label={
                        isWritingAssistantOpen ?
                          'Close ethnographer professor'
                        : 'Open ethnographer professor'
                      }
                    >
                      {isWritingAssistantOpen ?
                        <X className='h-4 w-4' />
                      : <Sparkles className='h-4 w-4' />}
                      <span>{isWritingAssistantOpen ? 'Close' : 'Professor'}</span>
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
                  title={noteState.title}
                  setTitle={noteHandlers.setTitle}
                  isViewingStudentNote={isViewingStudentNote}
                  onTitleChange={handleEdit}
                  titleRef={titleRef}
                />

                <NoteEditorContent
                  noteState={noteState}
                  noteHandlers={noteHandlers}
                  editor={editor}
                  isViewingStudentNote={isViewingStudentNote}
                  onEdit={handleEdit}
                />
              </div>
            </ScrollArea>

            {!!noteId && canComment && (isViewingStudentNote || isStudentViewingOwnNote) && (
              <CommentSidebarPanel
                noteId={noteState.note?.id as string}
                editor={editor}
                isInstructor={isInstructorUser}
                canComment={canComment}
                isOpen={isCommentSidebarOpen}
              />
            )}

            {!isViewingStudentNote && (
              <WritingAssistantSidebarPanel
                noteTitle={noteState.title}
                noteContent={noteState.editorContent}
                isOpen={isWritingAssistantOpen}
              />
            )}
          </div>
        </div>
      </RichTextEditorProvider>
    </CacheProvider>
  );
}
