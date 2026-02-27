import { useEffect, useRef, useMemo, RefObject, MutableRefObject } from 'react';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { usePersonalNotes } from '@/app/lib/hooks/queries/useNotes';
import { Note, newNote } from '@/app/types';
import type { PhotoMedia, VideoMedia } from '@/app/lib/models/media_class';
import type { NoteStateType, NoteHandlersType } from './useNoteState';
import type { RichTextEditorRef } from 'mui-tiptap';

interface UseNoteSyncOptions {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  initialNote: Note | newNote | undefined;
  rteRef: RefObject<RichTextEditorRef | null>;
  lastEditTimeRef: MutableRefObject<number>;
}

export const useNoteSync = ({
  noteState,
  noteHandlers,
  initialNote,
  rteRef,
  lastEditTimeRef,
}: UseNoteSyncOptions) => {
  // Get personal notes from TanStack Query instead of Zustand store.
  // Only subscribe when viewing own notes (not when instructor views student notes).
  const user = useAuthStore(state => state.user);
  const noteCreator = noteState.note?.creator;
  const isOwnNote = !noteCreator || noteCreator === user?.id;
  const { data: notes = [] } = usePersonalNotes(isOwnNote ? (user?.id ?? null) : null);

  const lastSyncedNoteRef = useRef<string>('');

  // Store noteHandlers in ref to avoid dependency issues
  const noteHandlersRef = useRef(noteHandlers);
  // eslint-disable-next-line react-hooks/refs -- intentional pattern to keep ref in sync
  noteHandlersRef.current = noteHandlers;

  // Destructure noteState for stable dependencies
  const {
    note,
    title,
    editorContent,
    isPublished,
    approvalRequested,
    tags,
    images,
    videos,
    audio,
  } = noteState;

  const stateNoteId = note?.id;

  // Get current note ID
  const currentNoteId =
    stateNoteId ||
    (initialNote && 'id' in initialNote ? initialNote.id : undefined);

  // Find current note in query data
  const currentNoteFromQuery = useMemo(() => {
    if (!currentNoteId) return undefined;
    return notes.find(n => n.id === currentNoteId);
  }, [notes, currentNoteId]);

  // Content hash for change detection
  const currentNoteContentHash = useMemo(() => {
    if (!currentNoteFromQuery) return null;
    return JSON.stringify({
      id: currentNoteFromQuery.id,
      text: currentNoteFromQuery.text,
      title: currentNoteFromQuery.title,
      published: currentNoteFromQuery.published,
      approvalRequested: currentNoteFromQuery.approvalRequested,
      tags: currentNoteFromQuery.tags,
      comments: currentNoteFromQuery.comments?.length || 0,
    });
  }, [currentNoteFromQuery]);

  // Initialize note from initialNote prop
  useEffect(() => {
    if (initialNote) {
      const handlers = noteHandlersRef.current;
      handlers.setNote(initialNote as Note);
      handlers.setEditorContent(initialNote.text || '');
      handlers.setTitle(initialNote.title || '');
      handlers.setImages(
        initialNote.media.filter((item): item is PhotoMedia => item.type === 'image'),
      );
      handlers.setTime(initialNote.time || new Date());
      handlers.setLongitude(initialNote.longitude || '');
      handlers.setLatitude(initialNote.latitude || '');
      handlers.setTags(
        (initialNote.tags || []).map(tag =>
          typeof tag === 'string' ? { label: tag, origin: 'user' } : tag,
        ),
      );
      handlers.setAudio(initialNote.audio || []);
      handlers.setIsPublished(initialNote.published || false);
      handlers.setApprovalRequested(initialNote.approvalRequested || false);
      handlers.setCounter(prevCounter => prevCounter + 1);
      handlers.setVideos(
        initialNote.media.filter((item): item is VideoMedia => item.type === 'video'),
      );

      lastSyncedNoteRef.current = '';
      lastEditTimeRef.current = Date.now();
    }
  }, [initialNote, lastEditTimeRef]);

  // Sync from query data to local state when external changes are detected
  useEffect(() => {
    if (!currentNoteId) {
      lastSyncedNoteRef.current = '';
      return;
    }

    // First try to use initialNote if it matches
    let sourceNote: Note | undefined = undefined;
    if (initialNote && 'id' in initialNote) {
      if (initialNote.id === currentNoteId) {
        sourceNote = initialNote as Note;
      }
    }

    // Fall back to query data
    if (!sourceNote) {
      sourceNote = notes.find(n => n.id === currentNoteId);
    }

    if (!sourceNote) {
      return;
    }

    const storeNote = sourceNote;
    const storeNoteText = storeNote.text || '';

    const storeNoteKey = JSON.stringify({
      id: storeNote.id,
      published: storeNote.published,
      approvalRequested: storeNote.approvalRequested,
      tags: storeNote.tags,
      comments: storeNote.comments?.length || 0,
      text: storeNoteText,
      title: storeNote.title,
    });

    const hasChanged = storeNoteKey !== lastSyncedNoteRef.current;

    if (hasChanged) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
      const shouldUpdate = timeSinceLastEdit > 2000;

      if (shouldUpdate) {
        const handlers = noteHandlersRef.current;
        handlers.setNote(storeNote);

        if (storeNote.title !== title && timeSinceLastEdit > 5000) {
          handlers.setTitle(storeNote.title);
        }
        if (storeNoteText !== editorContent && timeSinceLastEdit > 5000) {
          handlers.setEditorContent(storeNoteText);
          const editor = rteRef.current?.editor;
          if (editor) {
            const currentHtml = editor.getHTML();
            if (currentHtml !== storeNoteText) {
              editor.commands.setContent(storeNoteText);
            }
          }
          handlers.setCounter(prev => prev + 1);
        }

        if (storeNote.published !== isPublished) {
          handlers.setIsPublished(storeNote.published || false);
        }
        if (storeNote.approvalRequested !== approvalRequested) {
          handlers.setApprovalRequested(storeNote.approvalRequested || false);
        }
        if (JSON.stringify(storeNote.tags) !== JSON.stringify(tags)) {
          handlers.setTags(storeNote.tags || []);
        }

        const storeImages = (storeNote.media || []).filter(
          (item): item is PhotoMedia => item.type === 'image',
        );
        const storeVideos = (storeNote.media || []).filter(
          (item): item is VideoMedia => item.type === 'video',
        );
        if (JSON.stringify(storeImages) !== JSON.stringify(images)) {
          handlers.setImages(storeImages);
        }
        if (JSON.stringify(storeVideos) !== JSON.stringify(videos)) {
          handlers.setVideos(storeVideos);
        }
        if (JSON.stringify(storeNote.audio) !== JSON.stringify(audio)) {
          handlers.setAudio(storeNote.audio || []);
        }

        lastSyncedNoteRef.current = storeNoteKey;
      }
    } else {
      if (!lastSyncedNoteRef.current) {
        lastSyncedNoteRef.current = storeNoteKey;
      }
    }
  }, [
    notes,
    currentNoteId,
    stateNoteId,
    editorContent,
    initialNote,
    title,
    isPublished,
    approvalRequested,
    tags,
    images,
    videos,
    audio,
    rteRef,
    lastEditTimeRef,
  ]);

  // Watch for external content changes and update editor
  useEffect(() => {
    const editor = rteRef.current?.editor;
    if (!editor) return;

    const currentEditorContent = editor.getHTML();
    const stateContent = editorContent || '';

    if (currentEditorContent !== stateContent) {
      const timeSinceLastEdit = Date.now() - lastEditTimeRef.current;
      if (timeSinceLastEdit > 2000) {
        editor.commands.setContent(stateContent);
      }
    }
  }, [editorContent, rteRef, lastEditTimeRef]);

  // Focus at start only when switching to a different note
  const initialNoteIdRef = useRef<string | undefined>(
    initialNote && 'id' in initialNote ? initialNote.id : undefined,
  );

  useEffect(() => {
    const currentInitialId = initialNote && 'id' in initialNote ? initialNote.id : undefined;
    const previousInitialId = initialNoteIdRef.current;

    if (currentInitialId !== previousInitialId || previousInitialId === undefined) {
      const editor = rteRef.current?.editor;
      if (editor) {
        const t = setTimeout(() => editor.chain().focus('start').run(), 0);
        initialNoteIdRef.current = currentInitialId;
        return () => clearTimeout(t);
      }
    }
    initialNoteIdRef.current = currentInitialId;
  }, [initialNote, rteRef]);

  return {
    currentNoteId,
    currentNoteFromStore: currentNoteFromQuery,
    currentNoteContentHash,
  };
};
