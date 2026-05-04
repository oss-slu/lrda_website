import { create } from 'zustand';

interface NotesState {
  selectedNoteId: string | null;

  setSelectedNoteId: (id: string | null) => void;
}

export const useNotesStore = create<NotesState>()(set => ({
  selectedNoteId: null,

  setSelectedNoteId: (id: string | null) => {
    set({ selectedNoteId: id });
  },
}));
