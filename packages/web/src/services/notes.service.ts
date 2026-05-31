import type { Note, VideoMedia, PhotoMedia, AudioMedia, NoteMedia } from '@/types';
import type { Tag, NoteResponse, MediaResponse, AudioResponse } from '@lrda/shared';
import { fetchWithAuth, buildQueryString } from './api';

// Re-export shared API types for internal use
export type ApiNoteData = NoteResponse;
export type ApiMediaData = MediaResponse;
export type ApiAudioData = AudioResponse;

export interface NoteQueryOptions {
  limit?: number;
  skip?: number;
  userId?: string;
  published?: boolean;
  search?: string;
  sort?: 'newest' | 'oldest' | 'alphabetical';
}

export interface CreateNotePayload {
  title: string;
  text: string;
  textJson?: unknown;
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

export interface ViewportParams {
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  search?: string;
  creatorId?: string;
  limit?: number;
  offset?: number;
}

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
    textJson: data.textJson ?? undefined,
    time: data.time ? new Date(data.time) : new Date(data.createdAt),
    media: transformedMedia,
    audio: transformedAudio,
    creator: data.creatorId,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    locationName: data.locationName ?? null,
    published: data.isPublished,
    approvalRequested: data.approvalRequested,
    isReturned: data.isReturned,
    tags: data.tags || [],
    uid: data.creatorId,
  };
}

function transformNoteToApi(note: Note | CreateNotePayload): Record<string, unknown> {
  return {
    title: note.title,
    text: note.text,
    textJson: note.textJson ?? undefined,
    latitude: note.latitude ?? undefined,
    longitude: note.longitude ?? undefined,
    isPublished: note.published ?? false,
    approvalRequested: note.approvalRequested ?? false,
    isReturned: note.isReturned ?? false,
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

export async function fetchAllNotes(options: NoteQueryOptions = {}): Promise<Note[]> {
  const { limit = 20, skip = 0, userId, published, search, sort } = options;

  const params: Record<string, unknown> = {
    limit,
    offset: skip,
  };

  if (userId) params.creatorId = userId;
  if (published !== undefined) params.published = published;
  if (search) params.search = search;
  if (sort) params.sort = sort;

  const qs = buildQueryString(params);
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return data.map(transformApiNote);
}

export async function fetchPublishedNotes(
  limit = 20,
  skip = 0,
  options: {
    search?: string;
    creatorId?: string;
    sort?: 'newest' | 'oldest' | 'alphabetical';
  } = {},
): Promise<Note[]> {
  return fetchAllNotes({
    limit,
    skip,
    published: true,
    search: options.search,
    userId: options.creatorId,
    sort: options.sort,
  });
}

export async function fetchNotesByStudents(instructorId: string): Promise<Note[]> {
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes/students/${instructorId}`);
  return data.map(transformApiNote);
}

export async function fetchUserNotes(userId: string, limit = 150, skip = 0): Promise<Note[]> {
  const qs = buildQueryString({ creatorId: userId, limit, offset: skip });
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return data.map(transformApiNote);
}

export async function createNote(note: CreateNotePayload): Promise<ApiNoteData> {
  const payload = transformNoteToApi(note);
  return fetchWithAuth<ApiNoteData>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateNote(note: Note): Promise<ApiNoteData> {
  const payload = transformNoteToApi(note);
  return fetchWithAuth<ApiNoteData>(`/api/notes/${note.id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(id: string): Promise<boolean> {
  await fetchWithAuth<void>(`/api/notes/${id}`, { method: 'DELETE' });
  return true;
}

export async function fetchViewportNotes(params: ViewportParams = {}): Promise<Note[]> {
  const qs = buildQueryString({
    ...(params.creatorId ? { creatorId: params.creatorId } : { published: true }),
    fields: 'summary',
    minLat: params.minLat,
    maxLat: params.maxLat,
    minLng: params.minLng,
    maxLng: params.maxLng,
    search: params.search,
    limit: params.limit ?? 200,
    offset: params.offset ?? 0,
  });
  const data = await fetchWithAuth<ApiNoteData[]>(`/api/notes${qs}`);
  return data.map(transformApiNote);
}

export async function fetchNoteById(id: string): Promise<Note | null> {
  try {
    const data = await fetchWithAuth<ApiNoteData>(`/api/notes/${id}`);
    return transformApiNote(data);
  } catch {
    return null;
  }
}
