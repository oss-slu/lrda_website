import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesKeys } from './useNotes';
import { createNote, updateNote, deleteNote } from '@/services/notes.service';
import type { Note } from '@/types';
import type { CreateNotePayload } from '@/services/notes.service';

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateNotePayload) => createNote(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: notesKeys.personal(payload.creator) });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: Note) => updateNote(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId }: { noteId: string; creatorId?: string }) =>
      deleteNote(noteId),
    onMutate: async ({ noteId, creatorId }) => {
      if (!creatorId) return {};
      const cacheKey = notesKeys.personal(creatorId);
      await queryClient.cancelQueries({ queryKey: cacheKey });
      const previousNotes = queryClient.getQueryData<Note[]>(cacheKey);
      queryClient.setQueryData<Note[]>(cacheKey, old =>
        old ? old.filter(n => n.id !== noteId) : [],
      );
      return { previousNotes, cacheKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(context.cacheKey, context.previousNotes);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
  });
}
