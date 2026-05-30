/**
 * Type definitions for the Notes service.
 *
 * API response types (NoteResponse, MediaResponse, AudioResponse) are
 * auto-derived from the shared Zod schemas in @lrda/shared.
 * Only frontend-specific types are defined here.
 */

import type { Tag } from '@lrda/shared';
import type { NoteMedia, AudioMedia } from '@/types';

// Re-export shared API types so existing imports keep working
export type {
  NoteResponse as ApiNoteData,
  MediaResponse as ApiMediaData,
  AudioResponse as ApiAudioData,
} from '@lrda/shared';

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
  latitude?: number | null;
  longitude?: number | null;
  media?: NoteMedia[];
  audio?: AudioMedia[];
  published?: boolean;
  tags?: Tag[];
  time?: Date;
  approvalRequested?: boolean;
  isReturned?: boolean;
}
