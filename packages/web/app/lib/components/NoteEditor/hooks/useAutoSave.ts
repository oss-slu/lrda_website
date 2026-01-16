import { useState, useEffect, useRef, MutableRefObject, useCallback } from 'react';
import { toast } from 'sonner';
import { notesService } from '@/app/lib/services';
import { useNotesStore } from '@/app/lib/stores/notesStore';
import { Note } from '@/app/types';
import type { NoteStateType, NoteHandlersType } from './useNoteState';

interface LastSavedSnapshot {
  title: string;
  text: string;
  tags: any[];
  published: boolean;
  approvalRequested?: boolean;
  latitude?: string;
  longitude?: string;
}

interface UseAutoSaveOptions {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  isNewNote: boolean;
  isViewingStudentNote: boolean;
  authUserId: string | undefined;
  lastEditTimeRef: MutableRefObject<number>;
}

interface UseAutoSaveResult {
  isSaving: boolean;
  isCreatingNew: boolean;
  lastSavedAt: Date | null;
}

export const useAutoSave = ({
  noteState,
  noteHandlers,
  isNewNote,
  isViewingStudentNote,
  authUserId,
  lastEditTimeRef,
}: UseAutoSaveOptions): UseAutoSaveResult => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCreatingNew, setIsCreatingNew] = useState(isNewNote);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<LastSavedSnapshot | null>(null);
  const isSavingRef = useRef(false);

  // Reset isCreatingNew when isNewNote prop changes (e.g., switching notes)
  useEffect(() => {
    setIsCreatingNew(isNewNote);
    if (isNewNote) {
      // Reset the saved snapshot for new notes
      lastSavedSnapshotRef.current = null;
    }
  }, [isNewNote]);

  // Get stable references to store actions
  const updateNote = useNotesStore(state => state.updateNote);
  const addNote = useNotesStore(state => state.addNote);
  const clearDraftNote = useNotesStore(state => state.clearDraftNote);
  const setSelectedNoteId = useNotesStore(state => state.setSelectedNoteId);

  // Store noteHandlers in ref to avoid dependency issues
  const noteHandlersRef = useRef(noteHandlers);
  noteHandlersRef.current = noteHandlers;

  // Destructure noteState to get stable primitive values for dependencies
  const {
    title,
    editorContent,
    latitude,
    longitude,
    tags,
    isPublished,
    approvalRequested,
    images,
    videos,
    audio,
    time,
    note,
  } = noteState;

  const noteId = note?.id;
  const noteCreator = note?.creator;
  const noteUid = note?.uid;

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    const titleTrim = (title || '').trim();
    const textTrim = (editorContent || '').trim();
    const hasContent =
      titleTrim.length > 0 ||
      textTrim.length > 0 ||
      images.length > 0 ||
      videos.length > 0 ||
      audio.length > 0;

    // Create new note on first meaningful content
    if (isCreatingNew && !noteId && hasContent) {
      autoSaveTimerRef.current = setTimeout(async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setIsSaving(true);
        try {
          const newNoteData: any = {
            title: title || 'Untitled',
            text: editorContent,
            time: time,
            media: [...images, ...videos],
            audio: audio,
            creator: authUserId,
            latitude: latitude,
            longitude: longitude,
            published: isPublished,
            approvalRequested: approvalRequested || false,
            tags: tags,
            isArchived: false,
          };

          const data = await notesService.create(newNoteData);
          const newNoteId = data['@id'] || (data as any).id;
          if (!newNoteId) throw new Error('No ID returned');

          const savedNote = {
            ...newNoteData,
            id: newNoteId,
            uid: (data as any).uid || newNoteId,
          };

          noteHandlersRef.current.setNote(savedNote as Note);
          addNote(savedNote as Note);
          clearDraftNote();
          // Update selected note to the newly created note
          setSelectedNoteId(newNoteId);
          setIsCreatingNew(false);
          setLastSavedAt(new Date());
          lastSavedSnapshotRef.current = {
            title: title,
            text: editorContent,
            tags: tags,
            published: isPublished,
            approvalRequested: approvalRequested,
            latitude: latitude,
            longitude: longitude,
          };

          toast('Note Created', { description: 'Your note has been saved.', duration: 2000 });
        } catch (error) {
          console.error('Error creating note:', error);
          toast('Error', { description: 'Failed to create note.', duration: 4000 });
        } finally {
          isSavingRef.current = false;
          setIsSaving(false);
        }
      }, 500);
      return () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      };
    }

    // Skip auto-save if viewing student note (read-only) or no content
    if (!noteId || !hasContent || isViewingStudentNote) {
      return;
    }

    const last = lastSavedSnapshotRef.current;
    const isDirty =
      !last ||
      last.title !== title ||
      last.text !== editorContent ||
      last.published !== isPublished ||
      last.approvalRequested !== approvalRequested ||
      last.latitude !== latitude ||
      last.longitude !== longitude ||
      JSON.stringify(last.tags) !== JSON.stringify(tags);

    if (!isDirty) {
      return;
    }

    // Auto-save after 500ms of inactivity
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);

      const updatedNote: any = {
        ...note,
        text: editorContent,
        title: title || 'Untitled',
        media: [...images, ...videos],
        published: isPublished,
        approvalRequested: approvalRequested || false,
        time: time,
        longitude: longitude,
        latitude: latitude,
        tags: tags,
        audio: audio,
        id: noteId,
        creator: noteCreator,
      };

      try {
        await notesService.update(updatedNote);

        updateNote(noteId, {
          ...updatedNote,
          media: updatedNote.media || [],
          audio: updatedNote.audio || [],
        });

        lastSavedSnapshotRef.current = {
          title: title,
          text: editorContent,
          tags: tags,
          published: isPublished,
          approvalRequested: approvalRequested,
          latitude: latitude,
          longitude: longitude,
        };
        setLastSavedAt(new Date());
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    title,
    latitude,
    longitude,
    editorContent,
    tags,
    isPublished,
    images.length,
    videos.length,
    audio.length,
    isCreatingNew,
    noteId,
    approvalRequested,
    isViewingStudentNote,
    authUserId,
    updateNote,
    addNote,
    clearDraftNote,
    setSelectedNoteId,
    time,
    images,
    videos,
    audio,
    noteCreator,
    note,
  ]);

  return {
    isSaving,
    isCreatingNew,
    lastSavedAt,
  };
};
