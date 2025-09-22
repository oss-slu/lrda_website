import React, { createContext, useReducer, useContext, useEffect } from "react";
import ApiService from "./api_service";

const initialState = {
  notes: [],
  isLoading: false,
  error: null,
};

function notesReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, notes: action.notes };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.error };
    case "ADD_NOTE":
      return { ...state, notes: [action.note, ...state.notes] };
    case "UPDATE_NOTE":
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.note.id ? action.note : n)),
      };
    case "DELETE_NOTE":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
    default:
      return state;
  }
}

const NotesContext = createContext();

export const NotesProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  const fetchNotes = async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const notes = await ApiService.fetchPublishedNotes();
      dispatch({ type: "FETCH_SUCCESS", notes });
    } catch (error) {
      dispatch({ type: "FETCH_ERROR", error: error.message || "Failed to fetch notes" });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return <NotesContext.Provider value={{ state, dispatch, fetchNotes }}>{children}</NotesContext.Provider>;
};

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotes must be used within a NotesProvider");
  return context;
}
