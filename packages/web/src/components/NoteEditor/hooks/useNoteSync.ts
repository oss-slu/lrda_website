import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNoteEditorStore } from '@/stores/noteEditorStore';
import { usePersonalNotes } from '@/hooks/queries/useNotes';
import type { PhotoMedia, VideoMedia } from '@/types';
import type { Editor } from '@tiptap/core';

export function useNoteSync(editor: Editor | null) {
  const user = useAuthStore(state => state.user);
  const noteId = useNoteEditorStore(state => state.note?.id);
  const noteCreator = useNoteEditorStore(state => state.note?.creator);

  const isOwnNote = !noteCreator || noteCreator === user?.id;
  const { data: notes = [] } = usePersonalNotes(isOwnNote ? (user?.id ?? null) : null);

  const lastSyncedRef = useRef<string>('');

  useEffect(() => {
    if (!noteId) {
      lastSyncedRef.current = '';
      return;
    }

    const sourceNote = notes.find(n => n.id === noteId);
    if (!sourceNote) return;

    const key = JSON.stringify({
      id: sourceNote.id,
      published: sourceNote.published,
      approvalRequested: sourceNote.approvalRequested,
      tags: sourceNote.tags,
      text: sourceNote.text || '',
      title: sourceNote.title,
    });

    if (key === lastSyncedRef.current) return;

    const store = useNoteEditorStore.getState();
    const timeSinceEdit = Date.now() - store.lastEditTime;
    if (timeSinceEdit < 2000) return;

    store.setNote(sourceNote);

    if (timeSinceEdit > 5000) {
      if (sourceNote.title !== store.title) store.setTitle(sourceNote.title);

      const sourceText = sourceNote.text || '';
      if (sourceText !== store.editorContent) {
        store.setEditorContent(sourceText);
        if (editor && editor.getHTML() !== sourceText) {
          editor.commands.setContent(sourceText);
        }
      }
    }

    if (sourceNote.published !== store.isPublished) {
      store.setIsPublished(sourceNote.published || false);
    }
    if (sourceNote.approvalRequested !== store.approvalRequested) {
      store.setApprovalRequested(sourceNote.approvalRequested || false);
    }
    if (JSON.stringify(sourceNote.tags) !== JSON.stringify(store.tags)) {
      store.setTags(sourceNote.tags || []);
    }

    const storeImages = (sourceNote.media || []).filter(
      (m): m is PhotoMedia => m.type === 'image',
    );
    const storeVideos = (sourceNote.media || []).filter(
      (m): m is VideoMedia => m.type === 'video',
    );
    if (JSON.stringify(storeImages) !== JSON.stringify(store.images)) {
      store.setImages(storeImages);
    }
    if (JSON.stringify(storeVideos) !== JSON.stringify(store.videos)) {
      store.setVideos(storeVideos);
    }
    if (JSON.stringify(sourceNote.audio) !== JSON.stringify(store.audio)) {
      store.setAudio(sourceNote.audio || []);
    }

    lastSyncedRef.current = key;
  }, [notes, noteId, editor]);
}
