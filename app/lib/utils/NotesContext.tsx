"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Note } from "../../types";
import {
  fetchPublishedNotes as fetchPublishedNotesApi,
  fetchUserNotes as fetchUserNotesApi,
  fetchCreatorName as fetchCreatorNameApi,
} from "./api_service";
import DataConversion from "./data_conversion";

type CreatorNames = { [creatorId: string]: string };

type NotesContextType = {
  notes: Note[];
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  isLoadingNotes: boolean;
  creatorNames: CreatorNames;
  getCreatorName: (creatorId: string) => string | undefined;
  fetchPublishedNotes: () => Promise<void>;
  fetchUserNotes: (userId: string) => Promise<void>;
};

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [creatorNames, setCreatorNames] = useState<CreatorNames>({});

  // On component mount, fetch published notes
  // TODO: need location based fetching once we make rerum lat/lon numeric
  useEffect(() => {
    console.log("Fetching published notes on mount");
    fetchPublishedNotes();
  }, []);

  async function cacheCreatorNames(notes: Note[]) {
    const uniqueIds = Array.from(new Set(notes.map((n) => n.creator).filter(Boolean)));
    const uncachedIds = uniqueIds.filter((id) => !(id in creatorNames));
    if (uncachedIds.length === 0) return;

    const entries = await Promise.all(
      uncachedIds.map(async (id) => {
        try {
          const name = await fetchCreatorNameApi(id);
          return [id, name] as [string, string];
        } catch {
          return [id, "Unknown"] as [string, string];
        }
      })
    );
    setCreatorNames((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
  }

  async function fetchPublishedNotes() {
    setIsLoading(true);
    try {
      const oldestNoteDate = getOldestNoteDate(notes);
      const params: any = {};
      params.afterTime = oldestNoteDate ?? null;
      let newNotes = (await fetchPublishedNotesApi(params)).filter((note) => !note.isArchived);

      newNotes = DataConversion.convertMediaTypes(newNotes);
      setNotes((prevNotes) => [...prevNotes, ...newNotes]);
      await cacheCreatorNames(newNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // TODO change this to not need user id but use an auth context instead
  async function fetchUserNotes(userId: string) {
    setIsLoading(true);
    try {
      const oldestNoteDate = getOldestPersonalNoteDate(notes, userId);
      const params: any = { userId, published: true };
      params.afterTime = oldestNoteDate ?? null;

      let newNotes = (await fetchUserNotesApi(params)).filter((note) => !note.isArchived);
      newNotes = DataConversion.convertMediaTypes(newNotes);
      setNotes((prevNotes) => [...prevNotes, ...newNotes]);
      await cacheCreatorNames(newNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function getCreatorName(creatorId: string) {
    return creatorNames[creatorId];
  }

  function getOldestNoteDate(notes: Note[]): string | undefined {
    if (notes.length === 0) return undefined;
    const oldestNote = notes.reduce((oldest, note) => (new Date(note.time) < new Date(oldest.time) ? note : oldest), notes[0]);
    return oldestNote.time.toString();
  }

  function getOldestPersonalNoteDate(notes: Note[], userId: string): string | undefined {
    const personalNotes = notes.filter((note) => note.creator === userId);
    if (personalNotes.length === 0) return undefined;
    const oldestNote = personalNotes.reduce(
      (oldest, note) => (new Date(note.time) < new Date(oldest.time) ? note : oldest),
      personalNotes[0]
    );
    return oldestNote.time.toString();
  }

  return (
    <NotesContext.Provider
      value={{ notes, setNotes, isLoadingNotes: isLoading, creatorNames, getCreatorName, fetchPublishedNotes, fetchUserNotes }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotes must be used within a NotesProvider");
  return context;
}
