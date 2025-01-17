import {
  Media,
  PhotoType,
  VideoType,
  AudioType,
} from "./lib/models/media_class";
import { User } from "./lib/models/user_class";

export interface Tag {
  label: string;
  origin: "user" | "ai";
}

export type MediaData = {
  uuid: string;
  type: string;
  uri: string;
};

export type UserData = {
  uid: string;
  name: string;
  roles: {
    administrator: boolean;
    contributor: boolean;
  };
  isInstructor?: boolean; // New field for instructors
  parentInstructorId?: string; // New field for students
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
  tags: Tag[];
  uid: string;
  isArchived?: boolean; //add property of archived, then filter for it
};

export type CombinedResult =
  | (google.maps.places.AutocompletePrediction & { type: "suggestion" })
  | (Note & { type: "note" });

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

export type GoogleMapProps = {
  route: any;
  updateCounter: any;
  user: User;
};
