import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notesKeys } from '@/hooks/queries/useNotes';
import { useUpdateNote } from '@/hooks/queries/useNotesMutations';
import type { Note } from '@/types';
import { type NoteDraft, buildNoteFromDraft } from './useNoteForm';

function mediaFingerprint(items: { uri?: string; uuid?: string }[]): string {
  return items.map(m => m.uri || m.uuid || '').join('|');
}

function isDirty(draft: NoteDraft, snapshot: NoteDraft): boolean {
  return (
    draft.title !== snapshot.title ||
    draft.text !== snapshot.text ||
    draft.time.getTime() !== snapshot.time.getTime() ||
    draft.latitude !== snapshot.latitude ||
    draft.longitude !== snapshot.longitude ||
    draft.locationName !== snapshot.locationName ||
    draft.isPublished !== snapshot.isPublished ||
    draft.approvalRequested !== snapshot.approvalRequested ||
    draft.isReturned !== snapshot.isReturned ||
    JSON.stringify(draft.tags) !== JSON.stringify(snapshot.tags) ||
    mediaFingerprint([...draft.images, ...draft.videos]) !==
      mediaFingerprint([...snapshot.images, ...snapshot.videos]) ||
    mediaFingerprint(draft.audio) !== mediaFingerprint(snapshot.audio)
  );
}

function cloneDraft(draft: NoteDraft): NoteDraft {
  return {
    ...draft,
    tags: [...draft.tags],
    images: [...draft.images],
    videos: [...draft.videos],
    audio: [...draft.audio],
    time: new Date(draft.time.getTime()),
  };
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: Error | null;
  retry: () => void;
}

export function useAutoSave(
  draft: NoteDraft,
  note: Note,
  editable: boolean,
): AutoSaveState {
  const queryClient = useQueryClient();
  const mutation = useUpdateNote();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<NoteDraft>(cloneDraft(draft));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const pendingDraftRef = useRef<NoteDraft | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    snapshotRef.current = cloneDraft(draftRef.current);
  }, [note.id]);

  const save = useCallback(() => {
    if (!editable || !note.id || mutation.isPending) return;
    const currentDraft = pendingDraftRef.current ?? draft;
    if (!isDirty(currentDraft, snapshotRef.current)) return;

    const updatedNote = buildNoteFromDraft(currentDraft, note);
    mutation.mutate(updatedNote, {
      onSuccess: () => {
        if (note.creator) {
          queryClient.setQueryData<Note[]>(notesKeys.personal(note.creator), old => {
            if (!old) return old;
            return old.map(n => (n.id === note.id ? { ...n, ...updatedNote } : n));
          });
        }
        snapshotRef.current = cloneDraft(pendingDraftRef.current ?? draft);
        setLastSavedAt(new Date());
      },
    });
  }, [editable, note, draft, mutation, queryClient]);

  const retry = useCallback(() => {
    mutation.reset();
    save();
  }, [mutation, save]);

  useEffect(() => {
    if (!editable || !note.id) return;

    pendingDraftRef.current = draft;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isDirty(draft, snapshotRef.current)) return;

    timerRef.current = setTimeout(() => {
      if (!mutation.isPending) {
        save();
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, editable, note.id, mutation.isPending, save]);

  return {
    isSaving: mutation.isPending,
    lastSavedAt,
    saveError: mutation.error,
    retry,
  };
}
