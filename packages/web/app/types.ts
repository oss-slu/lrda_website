import type { CommentData } from './lib/services/comments.types';
import type { Tag, CommentPosition } from '@lrda/shared';

// Re-export shared types so existing imports from '@/app/types' keep working
export type { Tag, CommentPosition };


export type Comment = CommentData;

// Media types -- discriminated union on the `type` field.
// Use `m.type === 'video'` to narrow the type automatically.

export interface PhotoMedia {
  type: 'image';
  uuid: string;
  uri: string;
}

export interface VideoMedia {
  type: 'video';
  uuid: string;
  uri: string;
  thumbnail: string;
  duration: string;
}

export interface AudioMedia {
  type: 'audio';
  uuid: string;
  uri: string;
  duration: string;
  name: string;
}

/** A visual media item (photo or video) attached to a note. */
export type NoteMedia = PhotoMedia | VideoMedia;

/** Any media item including audio. */
export type AnyMedia = PhotoMedia | VideoMedia | AudioMedia;

// Re-export UserProfile derived from shared UserDetailSchema
// Kept as a named export for backward compatibility with existing imports
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: 'user' | 'admin';
  isInstructor: boolean;
  instructorId?: string | null;
  pendingInstructorDescription?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  instructor?: {
    id: string;
    name: string;
    email: string;
  } | null;
};

// Session type from better-auth
export type AuthSession = {
  token: string;
  userId: string;
  expiresAt: Date;
};

// Signup data type
export type SignUpData = {
  email: string;
  password: string;
  name: string;
};

export type Note = {
  id: string;
  title: string;
  text: string;
  time: Date;
  media: NoteMedia[];
  audio: AudioMedia[];
  creator: string;
  latitude: number | null;
  longitude: number | null;
  published: boolean | undefined;
  approvalRequested?: boolean | undefined;
  isReturned?: boolean | undefined;
  tags: Tag[];
  uid: string;
  comments?: Comment[];
};

export type CombinedResult =
  | (google.maps.places.AutocompletePrediction & { type: 'suggestion' })
  | (Note & { type: 'note' });

export type newNote = {
  title: string;
  text: string;
  time: Date;
  media: NoteMedia[];
  audio: AudioMedia[];
  creator: string;
  latitude: number | null;
  longitude: number | null;
  published: boolean | undefined;
  approvalRequested?: boolean | undefined;
  tags: Tag[];
};

export type ImageNote = {
  image: string;
  note: Note;
};
