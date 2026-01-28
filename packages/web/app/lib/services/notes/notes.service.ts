/**
 * Notes Service
 *
 * Handles all note-related operations including CRUD, search, and filtering.
 * Uses the REST API backend (Hono/PostgreSQL).
 *
 * Note: This service returns raw data from the API. The consuming code (stores, components)
 * is responsible for transforming the data into the appropriate types (e.g., class instances
 * for media/audio).
 */

import type { Note, Tag } from '@/app/types';
import { restClient, API_URL } from '../base/rest-client';
import { VideoType, PhotoType, AudioType } from '@/app/lib/models/media_class';
import type {
  NoteQueryOptions,
  NotesBoundsQuery,
  CreateNotePayload,
  ApiNoteData,
  ApiMediaData,
  ApiAudioData,
} from './notes.types';

class NotesService {
  /**
   * Fetch all notes with optional filtering.
   */
  async fetchAll(options: NoteQueryOptions = {}): Promise<Note[]> {
    const { limit = 150, skip = 0, userId, published } = options;

    const params: Record<string, unknown> = {
      limit,
      offset: skip,
    };

    if (userId) {
      params.creatorId = userId;
    }
    if (published !== undefined) {
      params.published = published;
    }

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
  }

  /**
   * Fetch notes filtered by date.
   */
  async fetchByDate(options: NoteQueryOptions): Promise<Note[]> {
    // Note: Date filtering would require backend support.
    // For now, we filter client-side after fetching.
    const { limit = 150, isGlobal = true, userId } = options;

    const params: Record<string, unknown> = { limit };
    if (!isGlobal && userId) {
      params.creatorId = userId;
    }

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
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
    const params = {
      published: true,
      minLat: bounds.swLat,
      maxLat: bounds.neLat,
      minLng: bounds.swLng,
      maxLng: bounds.neLng,
      limit,
      offset: skip,
    };

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
  }

  /**
   * Fetch notes by a list of student UIDs.
   */
  async fetchByStudents(studentUids: string[]): Promise<Note[]> {
    if (!studentUids.length) {
      return [];
    }

    // Fetch unpublished notes that have approval requested for each student
    const allNotes: Note[] = [];

    for (const uid of studentUids) {
      const params = {
        creatorId: uid,
        published: false,
        approvalRequested: true,
      };

      const queryString = restClient.buildQueryString(params);
      const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
      allNotes.push(...response.data.map(this.transformApiNote));
    }

    return allNotes;
  }

  /**
   * Fetch notes for a specific user.
   */
  async fetchUserNotes(userId: string, limit = 150, skip = 0): Promise<Note[]> {
    const params = {
      creatorId: userId,
      limit,
      offset: skip,
    };

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
  }

  /**
   * Create a new note.
   */
  async create(note: CreateNotePayload): Promise<ApiNoteData> {
    const payload = this.transformNoteToApi(note);
    const response = await restClient.post<ApiNoteData>('/api/notes', payload);

    if (!response.ok) {
      const error = new Error(`Failed to create note: ${response.status}`);
      console.error('[NotesService] Create failed:', response.data);
      throw error;
    }

    return response.data;
  }

  /**
   * Update an existing note (partial update).
   */
  async update(note: Note): Promise<ApiNoteData> {
    const payload = this.transformNoteToApi(note);
    const response = await restClient.patch<ApiNoteData>(`/api/notes/${note.id}`, payload);

    if (!response.ok) {
      const error = new Error(`Failed to update note: ${response.status}`);
      console.error('[NotesService] Update failed:', response.data);
      throw error;
    }

    return response.data;
  }

  /**
   * Delete a note.
   */
  async delete(id: string, _userId?: string): Promise<boolean> {
    const response = await restClient.delete<void>(`/api/notes/${id}`);
    return response.status === 204 || response.ok;
  }

  /**
   * Search notes by title or tags.
   */
  async search(query: string): Promise<Note[]> {
    // Fetch all notes then filter client-side
    // (Could add backend search support in the future)
    const response = await restClient.get<ApiNoteData[]>('/api/notes?limit=500');
    const notes = response.data.map(this.transformApiNote);
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
   * Query notes with custom parameters.
   */
  async query(queryObj: Record<string, unknown>, limit = 150, skip = 0): Promise<Note[]> {
    const params = {
      ...queryObj,
      limit,
      offset: skip,
    };

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
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
    const params: Record<string, unknown> = { limit, offset: skip };

    if (!global) {
      params.creatorId = userId;
    }
    if (published) {
      params.published = true;
    }

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
  }

  /**
   * Get paged query with custom parameters (legacy API compatibility).
   */
  async getPagedQueryWithParams(limit: number, skip: number, creatorId: string): Promise<Note[]> {
    const params = {
      creatorId,
      published: true,
      limit,
      offset: skip,
    };

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
  }

  /**
   * Transform API note data to internal Note format.
   */
  private transformApiNote = (data: ApiNoteData): Note => {
    // Transform API media to class instances
    const transformedMedia = (data.media || []).map((m: ApiMediaData) => {
      if (m.type === 'video') {
        return new VideoType({
          uuid: m.uuid || m.id,
          uri: m.uri,
          type: 'video',
          thumbnail: m.thumbnailUri || '',
          duration: '',
        });
      }
      // Default to PhotoType for images
      return new PhotoType({
        uuid: m.uuid || m.id,
        uri: m.uri,
        type: 'image',
      });
    });

    // Transform API audio to class instances
    const transformedAudio = (data.audio || []).map((a: ApiAudioData) => {
      return new AudioType({
        uuid: a.uuid || a.id,
        uri: a.uri,
        type: 'audio',
        duration: a.duration || '',
        name: a.name || '',
        isPlaying: false,
      });
    });

    return {
      id: data.id,
      title: data.title || '',
      text: data.text || '',
      time: data.time ? new Date(data.time) : new Date(data.createdAt),
      media: transformedMedia,
      audio: transformedAudio,
      creator: data.creatorId,
      latitude: data.latitude || '',
      longitude: data.longitude || '',
      published: data.isPublished,
      approvalRequested: data.approvalRequested,
      tags: data.tags || [],
      uid: data.creatorId,
      isArchived: false, // No longer using archive - hard deletes instead
      comments: data.comments,
    };
  };

  /**
   * Transform internal Note/CreateNotePayload to API format.
   */
  private transformNoteToApi(note: Note | CreateNotePayload): Record<string, unknown> {
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
}

// Export singleton instance
export const notesService = new NotesService();

// Export class for testing
export { NotesService };
