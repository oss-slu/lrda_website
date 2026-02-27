/**
 * Plain media types using a discriminated union on the `type` field.
 *
 * Use `m.type === 'video'` to narrow the type automatically --
 * no instanceof checks or casts needed.
 */

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
