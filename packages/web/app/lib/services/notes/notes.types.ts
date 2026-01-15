/**
 * Type definitions for the Notes service.
 */

import type { Note, Tag } from '@/app/types';
import type { VideoType, PhotoType, AudioType } from '@/app/lib/models/media_class';

/**
 * Options for querying notes.
 */
export interface NoteQueryOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip (for pagination) */
  skip?: number;
  /** Filter notes created after this date */
  afterDate?: string;
  /** Whether to fetch global notes (true) or user-specific (false) */
  isGlobal?: boolean;
  /** User ID for user-specific queries */
  userId?: string;
  /** Filter by published status */
  published?: boolean;
}

/**
 * Geographic bounds for spatial queries.
 */
export interface NotesBoundsQuery {
  /** Northeast latitude */
  neLat: number;
  /** Northeast longitude */
  neLng: number;
  /** Southwest latitude */
  swLat: number;
  /** Southwest longitude */
  swLng: number;
}

/**
 * Payload for creating a new note.
 * Uses the same media/audio types as Note for consistency.
 */
export interface CreateNotePayload {
  title: string;
  text: string;
  creator: string;
  latitude?: string;
  longitude?: string;
  media?: (VideoType | PhotoType)[];
  audio?: AudioType[];
  published?: boolean;
  tags?: Tag[];
  time?: Date;
  approvalRequested?: boolean;
  isArchived?: boolean;
}

/**
 * Payload for updating an existing note.
 */
export interface UpdateNotePayload extends CreateNotePayload {
  id: string;
}

/**
 * Raw note data from RERUM API.
 * This represents the JSON structure returned by RERUM,
 * which uses plain objects rather than class instances.
 */
export interface RerumNoteData {
  '@id': string;
  type: string;
  title: string;
  BodyText: string;
  creator: string;
  media?: unknown[];
  latitude?: string;
  longitude?: string;
  audio?: unknown[];
  published?: boolean;
  tags?: unknown[];
  time?: string;
  approvalRequested?: boolean;
  isArchived?: boolean;
  comments?: unknown[];
}

/**
 * Transform internal Note to RERUM format for API calls.
 * Note: The response from RERUM will be plain objects that need
 * to be handled by the consuming code (e.g., stores may reconstruct class instances).
 */
export function transformNoteToRerum(note: Note | CreateNotePayload): object {
  const payload: Record<string, unknown> = {
    type: 'message',
    title: note.title,
    BodyText: note.text,
    creator: note.creator,
    latitude: note.latitude || '',
    longitude: note.longitude || '',
    media: note.media,
    audio: note.audio,
    published: note.published,
    tags: note.tags,
    time: note.time || new Date(),
    approvalRequested: note.approvalRequested,
    isArchived: note.isArchived,
  };

  // Include @id for updates
  if ('id' in note && note.id) {
    payload['@id'] = note.id;
  }

  return payload;
}
