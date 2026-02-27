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

// Legacy type alias for backward compatibility during migration
// Components using UserData will continue to work
export type UserData = {
  uid: string; // Maps to UserProfile.id
  name: string;
  email?: string;
  students?: string[];
  roles: {
    administrator: boolean;
    contributor: boolean;
  };
  isInstructor?: boolean;
  parentInstructorId?: string; // Maps to UserProfile.instructorId
};

// Helper to convert UserProfile to legacy UserData format
export function toUserData(profile: UserProfile): UserData {
  return {
    uid: profile.id,
    name: profile.name,
    email: profile.email,
    roles: {
      administrator: profile.role === 'admin',
      contributor: true, // All users can contribute
    },
    isInstructor: profile.isInstructor,
    parentInstructorId: profile.instructorId ?? undefined,
  };
}

// Helper to check if user is admin
export function isAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'admin';
}

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
