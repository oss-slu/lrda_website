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

/**
 * Approval request data.
 */
export interface ApprovalRequestData {
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  title?: string;
  text?: string;
  creator?: string;
  media?: SerializedMediaItem[];
  audio?: SerializedAudioItem[];
  [key: string]: unknown;
}

/**
 * Note data passed to requestApproval.
 */
export interface ApprovalNoteData {
  instructorId: string;
  title?: string;
  text?: string;
  creator?: string;
  media?: unknown[];
  audio?: unknown[];
  [key: string]: unknown;
}
