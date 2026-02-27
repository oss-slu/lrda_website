/**
 * Notes Service
 *
 * Handles all note-related operations including CRUD, search, and filtering.
 * Uses the REST API backend (Hono/PostgreSQL).
 */

import type { Note } from '@/app/types';
import { fetchWithAuth, buildQueryString } from './api';
import type { VideoMedia, PhotoMedia, AudioMedia } from '@/app/types';
import type {
  NoteQueryOptions,
  CreateNotePayload,
  ApiNoteData,
  ApiMediaData,
  ApiAudioData,
} from './notes.types';

/**
 * Transform API note data to internal Note format.
 */
function transformApiNote(data: ApiNoteData): Note {
  const transformedMedia = (data.media || []).map((m: ApiMediaData): VideoMedia | PhotoMedia => {
    if (m.type === 'video') {
      return {
        type: 'video',
        uuid: m.uuid || m.id,
        uri: m.uri,
        thumbnail: m.thumbnailUri || '',
        duration: '',
      };
    }
    return {
      type: 'image',
      uuid: m.uuid || m.id,
      uri: m.uri,
    };
  });

  const transformedAudio: AudioMedia[] = (data.audio || []).map((a: ApiAudioData) => ({
    type: 'audio' as const,
    uuid: a.uuid || a.id,
    uri: a.uri,
    duration: a.duration || '',
    name: a.name || '',
  }));

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
  };
}

/**
 * Transform internal Note/CreateNotePayload to API format.
 */
function transformNoteToApi(note: Note | CreateNotePayload): Record<string, unknown> {
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
      thumbnailUri: m.type === 'video' ? m.thumbnail : undefined,
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

/**
 * Fetch all notes with optional filtering.
 */
async function fetchAll(options: NoteQueryOptions = {}): Promise<Note[]> {
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

  const qs = buildQueryString(params);
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return (data ?? []).map(transformApiNote);
}

/**
 * Fetch all published notes.
 */
async function fetchPublished(
  limit = 20,
  skip = 0,
  options: {
    search?: string;
    creatorId?: string;
    sort?: 'newest' | 'oldest' | 'alphabetical';
  } = {},
): Promise<Note[]> {
  return fetchAll({
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
 */
async function fetchByStudents(instructorId: string): Promise<Note[]> {
  const data = await fetchWithAuth<ApiNoteData[]>(
    `/api/notes/students/${instructorId}?approvalRequested=true`,
  );
  return (data ?? []).map(transformApiNote);
}

/**
 * Fetch notes for a specific user.
 */
async function fetchUserNotes(userId: string, limit = 150, skip = 0): Promise<Note[]> {
  const qs = buildQueryString({ creatorId: userId, limit, offset: skip });
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return (data ?? []).map(transformApiNote);
}

/**
 * Create a new note.
 */
async function create(note: CreateNotePayload): Promise<ApiNoteData> {
  const payload = transformNoteToApi(note);
  return fetchWithAuth<ApiNoteData>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing note (partial update).
 */
async function update(note: Note): Promise<ApiNoteData> {
  const payload = transformNoteToApi(note);
  return fetchWithAuth<ApiNoteData>(`/api/notes/${note.id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a note.
 */
async function deleteNote(id: string): Promise<boolean> {
  await fetchWithAuth<void>(`/api/notes/${id}`, { method: 'DELETE' });
  return true;
}

/**
 * Query notes with custom parameters.
 */
async function query(queryObj: Record<string, unknown>, limit = 150, skip = 0): Promise<Note[]> {
  const qs = buildQueryString({ ...queryObj, limit, offset: skip });
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return (data ?? []).map(transformApiNote);
}

/**
 * Fetch messages with pagination support (legacy API compatibility).
 */
async function fetchMessages(
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

  const qs = buildQueryString(params);
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return (data ?? []).map(transformApiNote);
}

export const notesService = {
  fetchAll,
  fetchPublished,
  fetchByStudents,
  fetchUserNotes,
  create,
  update,
  delete: deleteNote,
  query,
  fetchMessages,
};
