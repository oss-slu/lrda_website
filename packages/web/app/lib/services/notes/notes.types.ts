/**
 * Type definitions for the Notes service.
 */

import type { Tag, Comment } from '@/app/types';
import type { VideoType, PhotoType, AudioType } from '@/app/lib/models/media_class';

/**
 * Options for querying notes.
 */
export interface NoteQueryOptions {
  /** Maximum number of results to return */
  limit?: number;
  /** Number of results to skip (for pagination) */
  skip?: number;
  /** User ID for user-specific queries */
  userId?: string;
  /** Filter by published status */
  published?: boolean;
  /** Search text for title, body, and tags */
  search?: string;
  /** Sort order: newest, oldest, alphabetical */
  sort?: 'newest' | 'oldest' | 'alphabetical';
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
