import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NotesState {
  selectedNoteId: string | null;
  viewMode: 'my' | 'review';

  setSelectedNoteId: (id: string | null) => void;
  setViewMode: (mode: 'my' | 'review') => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    set => ({
      selectedNoteId: null,
      viewMode: 'my',

      setSelectedNoteId: (id: string | null) => {
        set({ selectedNoteId: id });
      },

      setViewMode: (mode: 'my' | 'review') => {
        set({ viewMode: mode });
      },
    }),
    {
      name: 'notes-store',
      partialize: state => ({
        viewMode: state.viewMode,
      }),
    },
  ),
);
