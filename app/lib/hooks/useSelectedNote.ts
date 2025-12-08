// hooks/useSelectedNote.ts
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Note } from '../../types';

// Define the structure for the hook's return
interface SelectedNoteHook {
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  initializeNote: (id: string | null) => void;
}

export function useSelectedNote(): SelectedNoteHook {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use local state to track the ID within the component that uses the hook
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Function to update the URL
  const updateUrl = useCallback((id: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (id) {
      newParams.set('selected', id);
    } else {
      newParams.delete('selected');
    }
    const newUrl = `?${newParams.toString()}`;
    
    // router.replace updates the URL without adding a new entry to the history stack
    router.replace(newUrl);
  }, [router, searchParams]);

  // Public setter function
  const setSelectedNoteId = (id: string | null) => {
    setSelectedId(id);
    updateUrl(id);
  };
  
  // Initialization function called on page load
  const initializeNote = (initialNoteId: string | null) => {
    // This is called by the component to start state (for example, reading initial data)
    setSelectedId(initialNoteId);
  }

  // Effect to handle browser back/forward navigation (popstate)
  useEffect(() => {
    const urlId = searchParams.get('selected');
    
    // Only update local state if the URL state has changed externally (browser buttons)
    if (urlId !== selectedId) {
        setSelectedId(urlId);
    }
    
  }, [searchParams]);


  return { 
    selectedNoteId: selectedId,
    setSelectedNoteId,
    initializeNote
  };
}