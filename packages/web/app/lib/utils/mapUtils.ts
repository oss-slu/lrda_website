import { Note } from '@/app/types';

export interface Location {
  lat: number;
  lng: number;
}

export interface BoundsParams {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Extract serializable bounding box params from a Google Maps LatLngBounds.
 * Returns null if bounds is null.
 */
export function boundsToParams(bounds: google.maps.LatLngBounds | null): BoundsParams | null {
  if (!bounds) return null;
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    minLat: sw.lat(),
    maxLat: ne.lat(),
    minLng: sw.lng(),
    maxLng: ne.lng(),
  };
}

/**
 * Filter notes that are within the given map bounds.
 */
export function filterNotesByMapBounds(
  bounds: google.maps.LatLngBounds | null,
  notes: Note[],
): Note[] {
  if (!bounds) return notes;

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  return notes.filter(note => {
    if (note.latitude == null || note.longitude == null) return false;
    return note.latitude >= sw.lat() && note.latitude <= ne.lat() && note.longitude >= sw.lng() && note.longitude <= ne.lng();
  });
}

/**
 * Filter notes by title and tags only (for notes panel search).
 */
export function filterNotesByTitleAndTags(notes: Note[], query: string): Note[] {
  const normalizedQuery = query.toLowerCase();

  return notes.filter(note => {
    const titleMatch =
      note.title && typeof note.title === 'string' ?
        note.title.toLowerCase().includes(normalizedQuery)
      : false;

    const tagsMatch =
      Array.isArray(note.tags) &&
      note.tags.some(
        tag =>
          tag.label &&
          typeof tag.label === 'string' &&
          tag.label.toLowerCase().includes(normalizedQuery),
      );

    return titleMatch || tagsMatch;
  });
}
