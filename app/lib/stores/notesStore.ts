import { create } from "zustand";
import { Note } from "@/app/types";
import ApiService from "../utils/api_service";
import DataConversion from "../utils/data_conversion";

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  selectedNoteId: string | null;

  // Actions
  fetchNotes: (userId: string) => Promise<void>;
  refreshNotes: (userId: string) => Promise<void>;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  clearNotes: () => void;
  setSelectedNoteId: (id: string | null) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  selectedNoteId: null,

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
      notes: state.notes.map((note) => (note.id === id ? { ...note, ...updates } : note)).filter((note) => !note.isArchived), // Ensure archived notes are removed
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
}));
