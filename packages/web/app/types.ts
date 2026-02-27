import type { CommentData } from './lib/services/comments/comments.types';
import { Media, PhotoType, VideoType, AudioType } from './lib/models/media_class';

export interface Tag {
  label: string;
  origin: 'user' | 'ai';
}

export type MediaData = {
  uuid: string;
  type: string;
  uri: string;
};

export type Comment = CommentData;

// New UserProfile type matching PostgreSQL schema (via better-auth)
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
  // Populated relation
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
  approvalRequested?: boolean | undefined; // New field for approval request
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
  approvalRequested?: boolean | undefined; // New field for approval request
  tags: Tag[];
};

export type ImageNote = {
  image: string;
  note: Note;
};
