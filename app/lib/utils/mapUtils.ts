import { Note } from "@/app/types";

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Filter notes that are within the given map bounds.
 */
export function filterNotesByMapBounds(bounds: google.maps.LatLngBounds | null, notes: Note[]): Note[] {
  if (!bounds) return notes;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return notes.filter((note) => {
    const lat = parseFloat(note.latitude);
    const lng = parseFloat(note.longitude);
    return lat >= sw.lat() && lat <= ne.lat() && lng >= sw.lng() && lng <= ne.lng();
  });
}

/**
 * Filter notes by search query (title, text, tags).
 */
export function filterNotesByQuery(notes: Note[], query: string): Note[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...notes];
  }

  return notes.filter((note) => {
    const titleMatch = note.title && typeof note.title === "string" ? note.title.toLowerCase().includes(normalizedQuery) : false;

    const textMatch = note.text && typeof note.text === "string" ? note.text.toLowerCase().includes(normalizedQuery) : false;

    const tagsMatch =
      Array.isArray(note.tags) &&
      note.tags.some((tag) => tag.label && typeof tag.label === "string" && tag.label.toLowerCase().includes(normalizedQuery));

    return titleMatch || textMatch || tagsMatch;
  });
}

/**
 * Filter notes by title and tags only (for notes panel search).
 */
export function filterNotesByTitleAndTags(notes: Note[], query: string): Note[] {
  const normalizedQuery = query.toLowerCase();

  return notes.filter((note) => {
    const titleMatch = note.title && typeof note.title === "string" ? note.title.toLowerCase().includes(normalizedQuery) : false;

    const tagsMatch =
      Array.isArray(note.tags) &&
      note.tags.some((tag) => tag.label && typeof tag.label === "string" && tag.label.toLowerCase().includes(normalizedQuery));

    return titleMatch || tagsMatch;
  });
}
