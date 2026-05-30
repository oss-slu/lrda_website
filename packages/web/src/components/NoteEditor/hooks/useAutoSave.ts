import { useEffect, useRef } from 'react';
import { notesService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';
import { notesKeys } from '@/hooks/queries/useNotes';
import { Note } from '@/types';
import { useNoteEditorStore, type NoteEditorStore } from '@/stores/noteEditorStore';

function mediaFingerprint(items: { uri?: string; uuid?: string }[]): string {
  return JSON.stringify(items.map(m => m.uri || m.uuid || ''));
}

interface Snapshot {
  title: string;
  text: string;
  tags: unknown[];
  published: boolean;
  approvalRequested: boolean;
  isReturned: boolean;
  latitude: number | null;
  longitude: number | null;
  mediaFp: string;
  audioFp: string;
}

function takeSnapshot(s: NoteEditorStore): Snapshot {
  return {
    title: s.title,
    text: s.editorContent,
    tags: s.tags,
    published: s.isPublished,
    approvalRequested: s.approvalRequested,
    isReturned: s.isReturned,
    latitude: s.latitude,
    longitude: s.longitude,
    mediaFp: mediaFingerprint([...s.images, ...s.videos]),
    audioFp: mediaFingerprint(s.audio),
  };
}

function isDirty(s: NoteEditorStore, last: Snapshot | null): boolean {
  if (!last) return true;
  const mediaFp = mediaFingerprint([...s.images, ...s.videos]);
  const audioFp = mediaFingerprint(s.audio);
  return (
    last.title !== s.title ||
    last.text !== s.editorContent ||
    last.published !== s.isPublished ||
    last.approvalRequested !== s.approvalRequested ||
    last.isReturned !== s.isReturned ||
    last.latitude !== s.latitude ||
    last.longitude !== s.longitude ||
    JSON.stringify(last.tags) !== JSON.stringify(s.tags) ||
    last.mediaFp !== mediaFp ||
    last.audioFp !== audioFp
  );
}

export function useAutoSave(isViewingStudentNote: boolean) {
  const queryClient = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    const store = useNoteEditorStore;

    const initState = store.getState();
    if (initState.note?.id) {
      snapshotRef.current = takeSnapshot(initState);
    }

    const unsub = store.subscribe((state, prev) => {
      if (isViewingStudentNote || !state.note?.id) return;

      if (state.note.id !== prev.note?.id) {
        snapshotRef.current = takeSnapshot(state);
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      if (timerRef.current) clearTimeout(timerRef.current);
      if (!isDirty(state, snapshotRef.current)) return;

      timerRef.current = setTimeout(async () => {
        if (savingRef.current) return;
        savingRef.current = true;

        const s = store.getState();
        s.setSaving(true);

        const lastSnap = snapshotRef.current;
        const currentMediaFp = mediaFingerprint([...s.images, ...s.videos]);
        const currentAudioFp = mediaFingerprint(s.audio);
        const mediaDirty = !lastSnap || lastSnap.mediaFp !== currentMediaFp;
        const audioDirty = !lastSnap || lastSnap.audioFp !== currentAudioFp;

        const { media: _, audio: _a, ...noteBase } = s.note || {};
        const updatedNote: Partial<Note> & { id: string; creator: string } = {
          ...noteBase,
          text: s.editorContent,
          title: s.title || 'Untitled',
          published: s.isPublished,
          approvalRequested: s.approvalRequested,
          isReturned: s.isReturned,
          time: s.time,
          longitude: s.longitude,
          latitude: s.latitude,
          tags: s.tags,
          id: s.note!.id,
          creator: s.note!.creator,
        } as Note;

        if (mediaDirty) (updatedNote as Note).media = [...s.images, ...s.videos];
        if (audioDirty) (updatedNote as Note).audio = s.audio;

        try {
          await notesService.update(updatedNote as Note);

          if (s.note?.creator) {
            queryClient.setQueryData<Note[]>(notesKeys.personal(s.note.creator), old => {
              if (!old) return old;
              return old.map(n => (n.id === s.note?.id ? { ...n, ...updatedNote } : n));
            });
          }

          snapshotRef.current = takeSnapshot(s);
          store.getState().setLastSavedAt(new Date());
        } catch (error) {
          console.error('Auto-save error:', error);
        } finally {
          savingRef.current = false;
          store.getState().setSaving(false);
        }
      }, 500);
    });

    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isViewingStudentNote, queryClient]);
}
