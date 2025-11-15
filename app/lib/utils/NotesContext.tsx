import React, { createContext, useContext, useState, useEffect } from 'react';

const NotesContext = createContext<any>(null);

export default function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState([]);

  return (
    <NotesContext.Provider value={{ notes, setNotes }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotesContext() {
  return useContext(NotesContext);
}