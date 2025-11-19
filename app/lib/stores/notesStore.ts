import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Note } from "@/app/types";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  selectedNoteId: string | null;
  viewMode: "my" | "review"; // Teacher-student view mode

  // Actions
  fetchNotes: (userId: string) => Promise<void>;
  refreshNotes: (userId: string) => Promise<void>;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  clearNotes: () => void;
  setSelectedNoteId: (id: string | null) => void;
  setViewMode: (mode: "my" | "review") => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      error: null,
      selectedNoteId: null,
      viewMode: "my",

      fetchNotes: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
          const userNotes = await ApiService.fetchUserMessages(userId);
          // Filter out archived notes
          const unarchivedNotes = userNotes.filter((note: Note) => !note.isArchived);

          const convertedNotes = DataConversion.convertMediaTypes(unarchivedNotes).reverse();

          set({ notes: convertedNotes, isLoading: false });
        } catch (error) {
          console.error("Error fetching notes:", error);
          set({ error: "Failed to fetch notes", isLoading: false });
        }
      },

      refreshNotes: async (userId: string) => {
        // Refresh without showing loading state
        await get().fetchNotes(userId);
      },

      addNote: (note: Note) => {
        set((state) => ({
          notes: [note, ...state.notes],
        }));
      },

      updateNote: (id: string, updates: Partial<Note>) => {
        set((state) => ({
          notes: state.notes.map((note) => {
            // Match by both id and @id to handle different note formats
            const noteId = note.id || (note as any)["@id"];
            const matchId = id || (updates as any)["@id"];
            if (noteId === matchId || noteId === id) {
              return { ...note, ...updates };
            }
            return note;
          }).filter((note) => !note.isArchived), // Ensure archived notes are removed
        }));
      },

      removeNote: (id: string) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      clearNotes: () => {
        set({ notes: [], error: null });
      },

      setSelectedNoteId: (id: string | null) => {
        set({ selectedNoteId: id });
      },

      setViewMode: (mode: "my" | "review") => {
        set({ viewMode: mode });
      },
    }),
    {
      name: "notes-store", // unique name for localStorage key
      partialize: (state) => ({
        // Only persist viewMode, not the entire state (notes, etc. should not be persisted)
        viewMode: state.viewMode,
      }),
    }
  )
);
