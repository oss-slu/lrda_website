/**
 * Notes Service
 *
 * Handles all note-related operations including CRUD, search, and filtering.
 * Uses the REST API backend (Hono/PostgreSQL).
 */

import type { Note } from '@/app/types';
import { restClient } from '../base/rest-client';
import { VideoType, PhotoType, AudioType } from '@/app/lib/models/media_class';
import type {
  NoteQueryOptions,
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
    const { limit = 20, skip = 0, userId, published, search, sort } = options;

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
    if (search) {
      params.search = search;
    }
    if (sort) {
      params.sort = sort;
    }

    const queryString = restClient.buildQueryString(params);
    const response = await restClient.get<ApiNoteData[]>(`/api/notes${queryString}`);
    return response.data.map(this.transformApiNote);
  }

  /**
   * Fetch all published notes.
   */
  async fetchPublished(
    limit = 20,
    skip = 0,
    options: {
      search?: string;
      creatorId?: string;
      sort?: 'newest' | 'oldest' | 'alphabetical';
    } = {},
  ): Promise<Note[]> {
    return this.fetchAll({
      limit,
      skip,
      published: true,
      search: options.search,
      userId: options.creatorId,
      sort: options.sort,
    });
  }

  /**
   * Fetch notes from an instructor's students using the dedicated backend endpoint.
   * This makes a single request that fetches all student notes in one DB query.
   */
  async fetchByStudents(instructorId: string): Promise<Note[]> {
    const response = await restClient.get<ApiNoteData[]>(
      `/api/notes/students/${instructorId}?approvalRequested=true`,
    );
    return response.data.map(this.transformApiNote);
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
  async delete(id: string): Promise<boolean> {
    const response = await restClient.delete<void>(`/api/notes/${id}`);

    if (!response.ok && response.status !== 204) {
      const error = new Error(`Failed to delete note: ${response.status}`);
      console.error('[NotesService] Delete failed:', response.data);
      throw error;
    }

    return true;
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
   * Transform API note data to internal Note format.
   */
  private transformApiNote = (data: ApiNoteData): Note => {
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
      return new PhotoType({
        uuid: m.uuid || m.id,
        uri: m.uri,
        type: 'image',
      });
    });

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
