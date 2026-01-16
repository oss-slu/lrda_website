import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { notesService } from '@/app/lib/services';
import { useNotesStore } from '@/app/lib/stores/notesStore';
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
  lastSavedAt: Date | null;
}

export const useAutoSave = ({
  noteState,
  isViewingStudentNote,
}: UseAutoSaveOptions): UseAutoSaveResult => {
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedSnapshotRef = useRef<LastSavedSnapshot | null>(null);
  const isSavingRef = useRef(false);

  const updateNote = useNotesStore(state => state.updateNote);

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

  // Track the current note ID to detect switches
  const currentNoteIdRef = useRef<string | undefined>(undefined);

  // When switching to a different note, initialize the snapshot with its current data
  // This prevents the auto-save from firing just because we switched notes
  if (noteId && currentNoteIdRef.current !== noteId) {
    currentNoteIdRef.current = noteId;
    lastSavedSnapshotRef.current = {
      title: title,
      text: editorContent,
      tags: tags,
      published: isPublished,
      approvalRequested: approvalRequested,
      latitude: latitude,
      longitude: longitude,
    };
  }

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Skip auto-save if viewing student note (read-only) or no note ID
    if (!noteId || isViewingStudentNote) {
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
    noteId,
    approvalRequested,
    isViewingStudentNote,
    updateNote,
    time,
    images,
    videos,
    audio,
    noteCreator,
    note,
  ]);

  return {
    isSaving,
    lastSavedAt,
  };
};
