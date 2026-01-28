import { Key, ReactNode } from 'react';
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

export type Comment = {
  authorName: ReactNode;
  id: Key | null | undefined;
  noteId: string;
  uid: string;
  text: string;
  author: string; // Display name
  authorId: string; // UID of the commenter
  role: 'instructor' | 'student'; // For styling or permissions
  createdAt: string; // ISO date
  position?: { from: number; to: number } | null; // Anchor to selected range
  threadId?: string | null; // Thread grouping id
  parentId?: string | null; // Parent comment id when this is a reply
  resolved?: boolean; // Whether the thread is resolved
  archived?: boolean; // Soft-delete flag
};

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
  isArchived?: boolean; //add property of archived, then filter for it
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
  isArchived?: boolean;
};

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Onboarding: undefined;
  Register: undefined;
  AccountPage: undefined;
  AddNote: { onSave: (note: Note) => void };
  EditNote: { note: Note; onSave: (note: Note) => void };
};

export type EditNoteScreenProps = {
  route: {
    params: {
      note: Note;
      onSave: (note: Note) => void;
    };
  };
  navigation: {
    goBack: () => void;
  };
};

export type RootTabParamList = {
  HomeTab: undefined;
  Tab1: undefined;
  Tab2: undefined;
};

export type HomeScreenProps = {
  navigation: any;
  route: { params?: { note: Note; onSave: (note: Note) => void } };
};

export type ProfilePageProps = {
  navigation: any;
};

export type EditNoteProps = {
  route: { params: { note: Note; onSave: (note: Note) => void } };
  navigation: {
    setOptions: (options: { headerTitle: string }) => void;
    goBack: () => void;
  };
};

export type AddNoteScreenProps = {
  navigation: any;
  route: any;
};

export type ImageNote = {
  image: string;
  note: Note;
};
