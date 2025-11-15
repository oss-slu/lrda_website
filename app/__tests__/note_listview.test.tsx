import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import NoteListView from "../lib/components/note_listview";

// Mock Firebase modules to prevent real initialization
jest.mock("../lib/config/firebase.js", () => ({
  auth: {},
  db: {},
  realtimeDb: {},
  storage: {},
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: { uid: "mockUserId", email: "mock@example.com" } })),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  Timestamp: jest.fn(),
}));

jest.mock("firebase/database", () => ({
  getDatabase: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
}));

describe("NoteListView", () => {
  const mockNotes = [
    { id: 1, title: "Note 1", text: "Content 1", time: new Date() },
    { id: 2, title: "Note 2", text: "Content 2", time: new Date() },
    { id: 3, title: "Note 3", text: "Content 3", time: new Date() },
  ];

  it("renders without crashing", () => {
    render(<NoteListView notes={mockNotes} onNoteSelect={jest.fn()} />);
  });

  it("displays the list of notes", () => {
    render(<NoteListView notes={mockNotes} onNoteSelect={jest.fn()} />);

    mockNotes.forEach((note) => {
      expect(screen.getByText(note.title)).toBeInTheDocument();
    });
  });

  it("calls the onNoteSelect function with false for isNewNote when a note is clicked", () => {
    const mockOnNoteSelect = jest.fn();
    render(<NoteListView notes={mockNotes} onNoteSelect={mockOnNoteSelect} />);

    fireEvent.click(screen.getByText("Note 1"));

    expect(mockOnNoteSelect).toHaveBeenCalledWith(mockNotes[0], false);
  });

  it("calls the onNoteSelect function with the first note and false for isNewNote on initial render", () => {
    const mockOnNoteSelect = jest.fn();
    render(<NoteListView notes={mockNotes} onNoteSelect={mockOnNoteSelect} />);

    expect(mockOnNoteSelect).toHaveBeenCalledWith(mockNotes[0], false);
  });
});
