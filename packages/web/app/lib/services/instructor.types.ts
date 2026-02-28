/**
 * Type definitions for the Instructor service.
 */

/**
 * Basic student information.
 */
export interface StudentInfo {
  id: string;
  name: string;
  email: string;
}

/**
 * Serialized media item for API payloads.
 */
export interface SerializedMediaItem {
  uuid: string;
  type: string;
  uri: string;
  thumbnail?: string;
  duration?: string;
  name?: string;
  isPlaying?: boolean;
}

/**
 * Serialized audio item for API payloads.
 */
export interface SerializedAudioItem {
  uuid: string;
  type: string;
  uri: string;
  duration?: string;
  name?: string;
  isPlaying?: boolean;
}

