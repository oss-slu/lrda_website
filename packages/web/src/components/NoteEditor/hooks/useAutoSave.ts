import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { notesService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import { notesKeys } from '@/hooks/queries/useNotes';
import { Note } from '@/types';
import type { NoteStateType, NoteHandlersType } from './useNoteState';

// Stable fingerprint for media/audio arrays so we can skip unchanged arrays
// in PATCH requests (avoids unnecessary delete+re-insert on the backend).
function mediaFingerprint(items: { uri?: string; uuid?: string }[]): string {
  return JSON.stringify(items.map(m => m.uri || m.uuid || ''));
}

interface LastSavedSnapshot {
  title: string;
  text: string;
  tags: any[];
  published: boolean;
  approvalRequested?: boolean;
  isReturned?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  mediaFingerprint: string;
  audioFingerprint: string;
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

  const queryClient = useQueryClient();

  const {
    title,
    editorContent,
    latitude,
    longitude,
    tags,
    isPublished,
    approvalRequested,
    isReturned,
    images,
    videos,
    audio,
    time,
    note,
  } = noteState;

  const noteId = note?.id;
  const noteCreator = note?.creator;

  // When switching to a different note, initialize the snapshot with its current data.
  // This prevents the auto-save from firing just because we switched notes.
  // Runs in useEffect (not during render) to be safe under React Strict Mode.
  useEffect(() => {
    if (!noteId) return;
    lastSavedSnapshotRef.current = {
      title,
      text: editorContent,
      tags,
      published: isPublished,
      approvalRequested,
      isReturned,
      latitude,
      longitude,
      mediaFingerprint: mediaFingerprint([...images, ...videos]),
      audioFingerprint: mediaFingerprint(audio),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-init when switching notes
  }, [noteId]);

  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Skip auto-save if viewing student note (read-only) or no note ID
    if (!noteId || isViewingStudentNote) {
      return;
    }

    const last = lastSavedSnapshotRef.current;
    const currentMediaFp = mediaFingerprint([...images, ...videos]);
    const currentAudioFp = mediaFingerprint(audio);

    const isDirty =
      !last ||
      last.title !== title ||
      last.text !== editorContent ||
      last.published !== isPublished ||
      last.approvalRequested !== approvalRequested ||
      last.isReturned !== isReturned ||
      last.latitude !== latitude ||
      last.longitude !== longitude ||
      JSON.stringify(last.tags) !== JSON.stringify(tags) ||
      last.mediaFingerprint !== currentMediaFp ||
      last.audioFingerprint !== currentAudioFp;

    if (!isDirty) {
      return;
    }

    // Auto-save after 500ms of inactivity
    autoSaveTimerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);

      // Re-read snapshot at fire time (not from the closure's `last`) so that
      // a concurrent save that completed during the debounce window is respected.
      const lastAtFire = lastSavedSnapshotRef.current;
      const mediaDirty = !lastAtFire || lastAtFire.mediaFingerprint !== currentMediaFp;
      const audioDirty = !lastAtFire || lastAtFire.audioFingerprint !== currentAudioFp;

      // Strip existing media/audio from the spread so we can conditionally include them
      const { media: _existingMedia, audio: _existingAudio, ...noteBase } = note || {};

      const updatedNote: any = {
        ...noteBase,
        text: editorContent,
        title: title || 'Untitled',
        published: isPublished,
        approvalRequested: approvalRequested || false,
        isReturned: isReturned || false,
        time: time,
        longitude: longitude,
        latitude: latitude,
        tags: tags,
        id: noteId,
        creator: noteCreator,
      };

      // Only include media/audio when they've actually changed.
      // When omitted, the backend PATCH skips the delete+re-insert cycle.
      if (mediaDirty) {
        updatedNote.media = [...images, ...videos];
      }
      if (audioDirty) {
        updatedNote.audio = audio;
      }

      try {
        await notesService.update(updatedNote);

        // Update the TanStack Query cache in-place (no refetch needed).
        // Only fields present on updatedNote will overwrite cache entries.
        if (noteCreator) {
          queryClient.setQueryData<Note[]>(notesKeys.personal(noteCreator), old => {
            if (!old) return old;
            return old.map(n => (n.id === noteId ? { ...n, ...updatedNote } : n));
          });
        }

        lastSavedSnapshotRef.current = {
          title: title,
          text: editorContent,
          tags: tags,
          published: isPublished,
          approvalRequested: approvalRequested,
          isReturned: isReturned,
          latitude: latitude,
          longitude: longitude,
          mediaFingerprint: currentMediaFp,
          audioFingerprint: currentAudioFp,
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
    noteId,
    approvalRequested,
    isReturned,
    isViewingStudentNote,
    time,
    images,
    videos,
    audio,
    noteCreator,
    note,
    queryClient,
  ]);

  return {
    isSaving,
    lastSavedAt,
  };
};
