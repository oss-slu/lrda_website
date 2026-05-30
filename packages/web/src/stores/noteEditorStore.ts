import { create } from 'zustand';
import type { Note, Tag, PhotoMedia, VideoMedia, AudioMedia } from '@/types';

interface NoteEditorState {
  note: Note | undefined;
  title: string;
  editorContent: string;
  images: PhotoMedia[];
  videos: VideoMedia[];
  audio: AudioMedia[];
  time: Date;
  latitude: number | null;
  longitude: number | null;
  locationName: string;
  tags: Tag[];
  isPublished: boolean;
  approvalRequested: boolean;
  isReturned: boolean;
  lastEditTime: number;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

interface NoteEditorActions {
  setNote: (note: Note | undefined) => void;
  setTitle: (title: string) => void;
  setEditorContent: (content: string) => void;
  setImages: (images: PhotoMedia[]) => void;
  addImage: (image: PhotoMedia) => void;
  setVideos: (videos: VideoMedia[]) => void;
  addVideo: (video: VideoMedia) => void;
  setAudio: (audio: AudioMedia[]) => void;
  addAudio: (item: AudioMedia) => void;
  setTime: (time: Date) => void;
  setLocation: (lat: number | null, lng: number | null) => void;
  setLocationName: (name: string) => void;
  setTags: (tags: (Tag | string)[]) => void;
  setIsPublished: (published: boolean) => void;
  setApprovalRequested: (requested: boolean) => void;
  setIsReturned: (returned: boolean) => void;
  markEdited: () => void;
  setSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
  reset: (note: Note | undefined) => void;
}

function extractState(note: Note | undefined): NoteEditorState {
  const media = note?.media || [];
  return {
    note,
    title: note?.title || '',
    editorContent: note?.text || '',
    images: media.filter((m): m is PhotoMedia => m.type === 'image'),
    videos: media.filter((m): m is VideoMedia => m.type === 'video'),
    audio: note?.audio || [],
    time: note?.time || new Date(),
    latitude: note?.latitude ?? null,
    longitude: note?.longitude ?? null,
    locationName: note?.locationName || '',
    tags: note?.tags || [],
    isPublished: note?.published || false,
    approvalRequested: note?.approvalRequested || false,
    isReturned: note?.isReturned || false,
    lastEditTime: 0,
    isSaving: false,
    lastSavedAt: null,
  };
}

function normalizeTags(tags: (Tag | string)[]): Tag[] {
  return tags.map(tag =>
    typeof tag === 'string' ? { label: tag, origin: 'user' as const } : tag,
  );
}

export type NoteEditorStore = NoteEditorState & NoteEditorActions;

export const useNoteEditorStore = create<NoteEditorStore>()(set => ({
  ...extractState(undefined),

  setNote: note => set({ note }),
  setTitle: title => set({ title }),
  setEditorContent: editorContent => set({ editorContent }),
  setImages: images => set({ images }),
  addImage: image => set(s => ({ images: [...s.images, image] })),
  setVideos: videos => set({ videos }),
  addVideo: video => set(s => ({ videos: [...s.videos, video] })),
  setAudio: audio => set({ audio }),
  addAudio: item => set(s => ({ audio: [...s.audio, item] })),
  setTime: time => set({ time }),
  setLocation: (latitude, longitude) => set({ latitude, longitude }),
  setLocationName: locationName => set({ locationName }),
  setTags: tags => set({ tags: normalizeTags(tags) }),
  setIsPublished: isPublished => set({ isPublished }),
  setApprovalRequested: approvalRequested => set({ approvalRequested }),
  setIsReturned: isReturned => set({ isReturned }),
  markEdited: () => set({ lastEditTime: Date.now() }),
  setSaving: isSaving => set({ isSaving }),
  setLastSavedAt: lastSavedAt => set({ lastSavedAt }),
  reset: note => set({ ...extractState(note), lastEditTime: Date.now() }),
}));
