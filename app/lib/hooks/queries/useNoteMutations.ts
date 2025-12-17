import { useMutation, useQueryClient } from "@tanstack/react-query";
import ApiService from "../../utils/api_service";
import { Note } from "@/app/types";
import { notesKeys } from "./useNotes";
import { toast } from "sonner";

/**
 * Hook for updating a note
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Note) => {
      return await ApiService.overwriteNote(note);
    },
    onSuccess: () => {
      // Invalidate all note queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
    },
    onError: (error) => {
      console.error("Failed to update note:", error);
      toast.error("Failed to update note");
    },
  });
}

/**
 * Hook for creating a new note
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Note) => {
      return await ApiService.writeNewNote(note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      toast.success("Note created successfully");
    },
    onError: (error) => {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
    },
  });
}

/**
 * Hook for publishing/unpublishing a note
 */
export function usePublishNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note, publish }: { note: Note; publish: boolean }) => {
      const updatedNote = { ...note, published: publish };
      return await ApiService.overwriteNote(updatedNote);
    },
    onSuccess: (_, { publish }) => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      toast.success(publish ? "Note published" : "Note unpublished");
    },
    onError: (error) => {
      console.error("Failed to update publish status:", error);
      toast.error("Failed to update publish status");
    },
  });
}

/**
 * Hook for archiving a note
 */
export function useArchiveNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: Note) => {
      const updatedNote = {
        ...note,
        isArchived: true,
        published: false,
        archivedAt: new Date().toISOString(),
      };
      return await ApiService.overwriteNote(updatedNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesKeys.all });
      toast.success("Note archived successfully");
    },
    onError: (error) => {
      console.error("Failed to archive note:", error);
      toast.error("Failed to archive note");
    },
  });
}
