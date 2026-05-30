import { useReducer, useCallback, useEffect, Dispatch } from 'react';
import type { Note, Tag, PhotoMedia, VideoMedia, AudioMedia, NoteMedia } from '@/types';

export interface NoteDraft {
  title: string;
  text: string;
  textJson?: unknown;
  tags: Tag[];
  images: PhotoMedia[];
  videos: VideoMedia[];
  audio: AudioMedia[];
  time: Date;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  isPublished: boolean;
  approvalRequested: boolean;
  isReturned: boolean;
}

type Action =
  | { type: 'SET_TITLE'; title: string }
  | { type: 'SET_TEXT'; text: string; textJson?: unknown }
  | { type: 'SET_TAGS'; tags: (Tag | string)[] }
  | { type: 'ADD_IMAGE'; image: PhotoMedia }
  | { type: 'ADD_VIDEO'; video: VideoMedia }
  | { type: 'ADD_AUDIO'; audio: AudioMedia }
  | { type: 'SET_TIME'; time: Date }
  | { type: 'SET_LOCATION'; latitude: number | null; longitude: number | null }
  | { type: 'SET_LOCATION_NAME'; name: string }
  | { type: 'SET_PUBLISHED'; published: boolean }
  | { type: 'SET_APPROVAL_REQUESTED'; requested: boolean }
  | { type: 'SET_RETURNED'; returned: boolean }
  | { type: 'RESET'; note: Note }
  | { type: 'SYNC_STATUS'; published: boolean; approvalRequested: boolean; isReturned: boolean };

function normalizeTags(tags: (Tag | string)[]): Tag[] {
  return tags.map(tag =>
    typeof tag === 'string' ? { label: tag, origin: 'user' as const } : tag,
  );
}

function extractDraft(note: Note): NoteDraft {
  return {
    title: note.title,
    text: note.text,
    textJson: note.textJson,
    tags: note.tags,
    images: note.media.filter((m): m is PhotoMedia => m.type === 'image'),
    videos: note.media.filter((m): m is VideoMedia => m.type === 'video'),
    audio: note.audio,
    time: note.time,
    latitude: note.latitude ?? null,
    longitude: note.longitude ?? null,
    locationName: note.locationName || '',
    isPublished: note.published || false,
    approvalRequested: note.approvalRequested || false,
    isReturned: note.isReturned || false,
  };
}

function reducer(state: NoteDraft, action: Action): NoteDraft {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.title };
    case 'SET_TEXT':
      return { ...state, text: action.text, textJson: action.textJson };
    case 'SET_TAGS':
      return { ...state, tags: normalizeTags(action.tags) };
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, action.image] };
    case 'ADD_VIDEO':
      return { ...state, videos: [...state.videos, action.video] };
    case 'ADD_AUDIO':
      return { ...state, audio: [...state.audio, action.audio] };
    case 'SET_TIME':
      return { ...state, time: action.time };
    case 'SET_LOCATION':
      return { ...state, latitude: action.latitude, longitude: action.longitude };
    case 'SET_LOCATION_NAME':
      return { ...state, locationName: action.name };
    case 'SET_PUBLISHED':
      return { ...state, isPublished: action.published };
    case 'SET_APPROVAL_REQUESTED':
      return { ...state, approvalRequested: action.requested };
    case 'SET_RETURNED':
      return { ...state, isReturned: action.returned };
    case 'RESET':
      return extractDraft(action.note);
    case 'SYNC_STATUS':
      return {
        ...state,
        isPublished: action.published,
        approvalRequested: action.approvalRequested,
        isReturned: action.isReturned,
      };
  }
}

export interface NoteFormActions {
  setTitle: (title: string) => void;
  setText: (text: string, textJson?: unknown) => void;
  setTags: (tags: (Tag | string)[]) => void;
  addImage: (image: PhotoMedia) => void;
  addVideo: (video: VideoMedia) => void;
  addAudio: (audio: AudioMedia) => void;
  setTime: (time: Date) => void;
  setLocation: (lat: number | null, lng: number | null) => void;
  setLocationName: (name: string) => void;
  setPublished: (published: boolean) => void;
  setApprovalRequested: (requested: boolean) => void;
  setReturned: (returned: boolean) => void;
  dispatch: Dispatch<Action>;
}

export function useNoteForm(note: Note): { draft: NoteDraft; actions: NoteFormActions } {
  const [draft, dispatch] = useReducer(reducer, note, extractDraft);

  useEffect(() => {
    const serverPublished = note.published || false;
    const serverApproval = note.approvalRequested || false;
    const serverReturned = note.isReturned || false;

    dispatch({
      type: 'SYNC_STATUS',
      published: serverPublished,
      approvalRequested: serverApproval,
      isReturned: serverReturned,
    });
  }, [note.published, note.approvalRequested, note.isReturned]);

  const actions: NoteFormActions = {
    setTitle: useCallback((title: string) => dispatch({ type: 'SET_TITLE', title }), []),
    setText: useCallback((text: string, textJson?: unknown) => dispatch({ type: 'SET_TEXT', text, textJson }), []),
    setTags: useCallback((tags: (Tag | string)[]) => dispatch({ type: 'SET_TAGS', tags }), []),
    addImage: useCallback((image: PhotoMedia) => dispatch({ type: 'ADD_IMAGE', image }), []),
    addVideo: useCallback((video: VideoMedia) => dispatch({ type: 'ADD_VIDEO', video }), []),
    addAudio: useCallback((audio: AudioMedia) => dispatch({ type: 'ADD_AUDIO', audio }), []),
    setTime: useCallback((time: Date) => dispatch({ type: 'SET_TIME', time }), []),
    setLocation: useCallback(
      (lat: number | null, lng: number | null) =>
        dispatch({ type: 'SET_LOCATION', latitude: lat, longitude: lng }),
      [],
    ),
    setLocationName: useCallback(
      (name: string) => dispatch({ type: 'SET_LOCATION_NAME', name }),
      [],
    ),
    setPublished: useCallback(
      (published: boolean) => dispatch({ type: 'SET_PUBLISHED', published }),
      [],
    ),
    setApprovalRequested: useCallback(
      (requested: boolean) => dispatch({ type: 'SET_APPROVAL_REQUESTED', requested }),
      [],
    ),
    setReturned: useCallback(
      (returned: boolean) => dispatch({ type: 'SET_RETURNED', returned }),
      [],
    ),
    dispatch,
  };

  return { draft, actions };
}

export function buildNoteFromDraft(draft: NoteDraft, note: Note): Note {
  return {
    ...note,
    title: draft.title || 'Untitled',
    text: draft.text,
    textJson: draft.textJson,
    media: [...draft.images, ...draft.videos] as NoteMedia[],
    audio: draft.audio,
    tags: draft.tags,
    time: draft.time,
    latitude: draft.latitude,
    longitude: draft.longitude,
    locationName: draft.locationName,
    published: draft.isPublished,
    approvalRequested: draft.approvalRequested,
    isReturned: draft.isReturned,
  };
}
