/**
 * Notes Service
 *
 * Handles all note-related operations including CRUD, search, and filtering.
 * Uses RERUM as the backend storage.
 *
 * Note: This service returns raw data from RERUM. The consuming code (stores, components)
 * is responsible for transforming the data into the appropriate types (e.g., class instances
 * for media/audio).
 */

import type { Note, Tag } from '@/app/types';
import { rerumClient, RERUM_PREFIX } from '../base/rerum-client';
import type {
  NoteQueryOptions,
  NotesBoundsQuery,
  CreateNotePayload,
  RerumNoteData,
} from './notes.types';
import { transformNoteToRerum } from './notes.types';

class NotesService {
  /**
   * Fetch all notes with optional filtering.
   */
  async fetchAll(options: NoteQueryOptions = {}): Promise<Note[]> {
    const { limit = 150, skip = 0, userId, published } = options;

    const queryObj: Record<string, unknown> = { type: 'message' };

    if (userId) {
      queryObj.creator = userId;
    }
    if (published !== undefined) {
      queryObj.published = published;
    }

    return rerumClient.pagedQuery<Note>(queryObj, limit, skip);
  }

  /**
   * Fetch notes filtered by date.
   */
  async fetchByDate(options: NoteQueryOptions): Promise<Note[]> {
    const { limit = 150, afterDate, isGlobal = true, userId } = options;

    const queryObj: Record<string, unknown> = { type: 'message' };

    if (afterDate) {
      queryObj.time = { $gt: afterDate };
    }
    if (!isGlobal && userId) {
      queryObj.creator = userId;
    }

    return rerumClient.query<Note>(queryObj, { limit });
  }

  /**
   * Fetch all published notes.
   */
  async fetchPublished(limit = 150, skip = 0): Promise<Note[]> {
    return this.fetchAll({ limit, skip, published: true });
  }

  /**
   * Fetch published notes within geographic bounds.
   */
  async fetchByBounds(bounds: NotesBoundsQuery, limit = 150, skip = 0): Promise<Note[]> {
    const queryObj = {
      type: 'message',
      published: true,
      'latitude[gte]': bounds.swLat,
      'latitude[lte]': bounds.neLat,
      'longitude[gte]': bounds.swLng,
      'longitude[lte]': bounds.neLng,
    };

    return rerumClient.pagedQuery<Note>(queryObj, limit, skip);
  }

  /**
   * Fetch notes by a list of student UIDs.
   * Handles both direct UIDs and RERUM URL formats.
   */
  async fetchByStudents(studentUids: string[]): Promise<Note[]> {
    if (!studentUids.length) {
      return [];
    }

    // Build creator variations (UID + RERUM URL format)
    const creatorValues = studentUids.flatMap(uid => [uid, `${RERUM_PREFIX}id/${uid}`]);

    const queryObj = {
      type: 'message',
      published: false,
      approvalRequested: true,
      creator: { $in: creatorValues },
      $or: [{ isArchived: { $exists: false } }, { isArchived: false }],
    };

    const notes = await rerumClient.pagedQuery<Note>(queryObj);
    return this.normalizeCreators(notes, studentUids);
  }

  /**
   * Fetch notes for a specific user.
   */
  async fetchUserNotes(userId: string, limit = 150, skip = 0): Promise<Note[]> {
    return rerumClient.pagedQuery<Note>({ type: 'message', creator: userId }, limit, skip);
  }

  /**
   * Create a new note.
   */
  async create(note: CreateNotePayload): Promise<RerumNoteData> {
    const payload = transformNoteToRerum(note);
    const response = await rerumClient.create<RerumNoteData>(payload);

    if (!response.ok) {
      throw new Error('Failed to create note');
    }

    return response.data;
  }

  /**
   * Update an existing note (full overwrite).
   */
  async update(note: Note): Promise<RerumNoteData> {
    const payload = transformNoteToRerum(note);
    const response = await rerumClient.overwrite<RerumNoteData>(payload);

    if (!response.ok) {
      throw new Error('Failed to update note');
    }

    return response.data;
  }

  /**
   * Delete a note.
   */
  async delete(id: string, userId: string): Promise<boolean> {
    return rerumClient.remove(id, { type: 'message', creator: userId });
  }

  /**
   * Search notes by title or tags.
   */
  async search(query: string): Promise<Note[]> {
    // Fetch all notes then filter client-side
    // (RERUM doesn't support text search)
    const notes = await rerumClient.pagedQuery<Note>({ type: 'message' });
    const lowerQuery = query.toLowerCase();

    return notes.filter(note => {
      // Check title
      if (note.title?.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Check tags (Tag objects have a 'label' property)
      if (note.tags?.some((tag: Tag) => tag.label?.toLowerCase().includes(lowerQuery))) {
        return true;
      }
      return false;
    });
  }

  /**
   * Fetch messages with pagination support (legacy API compatibility).
   */
  async fetchMessages(
    global: boolean,
    published: boolean,
    userId: string,
    limit = 150,
    skip = 0,
  ): Promise<Note[]> {
    const queryObj: Record<string, unknown> = { type: 'message' };

    if (!global) {
      queryObj.creator = userId;
    }
    if (published) {
      queryObj.published = true;
    }

    return rerumClient.pagedQuery<Note>(queryObj, limit, skip);
  }

  /**
   * Get paged query with custom parameters (legacy API compatibility).
   */
  async getPagedQueryWithParams(limit: number, skip: number, creatorId: string): Promise<Note[]> {
    const queryObj = {
      type: 'message',
      creator: creatorId,
      published: true,
    };
    return rerumClient.pagedQuery<Note>(queryObj, limit, skip);
  }

  /**
   * Normalize creator IDs by extracting UIDs from RERUM URLs.
   * Filters notes to only include those from valid student UIDs.
   */
  private normalizeCreators(notes: Note[], validUids: string[]): Note[] {
    return notes.filter(note => {
      if (!note.creator) {
        return false;
      }

      let normalizedCreator = note.creator;

      // Check if creator is a URL
      if (note.creator.startsWith('http')) {
        // Extract UID from RERUM URL format: .../v1/id/{uid} or .../id/{uid}
        const match = note.creator.match(/\/(?:v1\/)?id\/([^\/\?]+)/);

        if (match?.[1]) {
          normalizedCreator = match[1];
        } else {
          // Fallback: get last path segment
          normalizedCreator = note.creator.split('/').pop() || note.creator;
        }
      }

      return validUids.includes(normalizedCreator);
    });
  }
}

// Export singleton instance
export const notesService = new NotesService();

// Export class for testing
export { NotesService };
