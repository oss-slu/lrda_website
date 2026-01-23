/**
 * Type definitions for the Notes service.
 */

import type { Note, Tag, Comment } from '@/app/types';
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
}

/**
 * Payload for updating an existing note.
 */
export interface UpdateNotePayload extends CreateNotePayload {
  id: string;
}

/**
 * Media data from API.
 */
export interface ApiMediaData {
  id: string;
  noteId: string;
  type: string;
  uri: string;
  thumbnailUri?: string | null;
  uuid?: string | null;
  createdAt: string;
}

/**
 * Audio data from API.
 */
export interface ApiAudioData {
  id: string;
  noteId: string;
  uri: string;
  name?: string | null;
  duration?: string | null;
  uuid?: string | null;
  createdAt: string;
}

/**
 * Note data from REST API.
 */
export interface ApiNoteData {
  id: string;
  title: string | null;
  text: string;
  creatorId: string;
  latitude: string | null;
  longitude: string | null;
  isPublished: boolean;
  approvalRequested: boolean;
  tags: Tag[] | null;
  time: string;
  createdAt: string;
  updatedAt: string;
  media?: ApiMediaData[];
  audio?: ApiAudioData[];
  comments?: Comment[];
}

/**
 * Transform internal Note to API format for API calls.
 * @deprecated Use NotesService methods directly which handle transformation internally.
 */
export function transformNoteToApi(note: Note | CreateNotePayload): object {
  return {
    title: note.title,
    text: note.text,
    latitude: note.latitude || undefined,
    longitude: note.longitude || undefined,
    isPublished: note.published ?? false,
    approvalRequested: note.approvalRequested ?? false,
    tags: note.tags || [],
    time: note.time ? new Date(note.time).toISOString() : undefined,
    media: note.media?.map(m => ({
      type: m.type,
      uri: m.uri,
      thumbnailUri: (m as any).thumbnail,
      uuid: m.uuid,
    })),
    audio: note.audio?.map(a => ({
      uri: a.uri,
      name: a.name,
      duration: a.duration,
      uuid: a.uuid,
    })),
  };
}

// Legacy type aliases for backward compatibility
/** @deprecated Use ApiNoteData instead */
export type RerumNoteData = ApiNoteData;
/** @deprecated Use transformNoteToApi instead */
export const transformNoteToRerum = transformNoteToApi;
