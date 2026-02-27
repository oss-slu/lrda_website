import type { CommentData } from './lib/services/comments/comments.types';
import type { Tag, CommentPosition } from '@lrda/shared';
import { Media, PhotoType, VideoType, AudioType } from './lib/models/media_class';

// Re-export shared types so existing imports from '@/app/types' keep working
export type { Tag, CommentPosition };

export type MediaData = {
  uuid: string;
  type: string;
  uri: string;
};

export type Comment = CommentData;

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
  media: (VideoType | PhotoType)[];
  audio: AudioType[];
  creator: string;
  latitude: string;
  longitude: string;
  published: boolean | undefined;
  approvalRequested?: boolean | undefined;
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
  media: (VideoType | PhotoType)[];
  audio: AudioType[];
  creator: string;
  latitude: string;
  longitude: string;
  published: boolean | undefined;
  approvalRequested?: boolean | undefined;
  tags: Tag[];
};

export type ImageNote = {
  image: string;
  note: Note;
};
