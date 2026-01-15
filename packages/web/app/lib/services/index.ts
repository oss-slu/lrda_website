/**
 * Services Index
 *
 * Central export point for all services.
 * Import services from this file for cleaner imports:
 *
 * import { notesService, usersService } from '@/app/lib/services';
 */

// Base clients
export { HttpClient } from './base/http-client';
export type { HttpClientConfig, ApiResponse, ApiError } from './base/http-client';

export { RerumClient, rerumClient, RERUM_PREFIX } from './base/rerum-client';
export type { PagedQueryOptions } from './base/rerum-client';

// Notes service
export { notesService, NotesService } from './notes/notes.service';
export type {
  NoteQueryOptions,
  NotesBoundsQuery,
  CreateNotePayload,
  UpdateNotePayload,
  RerumNoteData,
} from './notes/notes.types';
export { transformNoteToRerum } from './notes/notes.types';

// Users service
export { usersService, UsersService } from './users/users.service';
export type { UserData, UserRoles, CreateUserOptions, RerumAgentData } from './users/users.types';

// Comments service
export { commentsService, CommentsService } from './comments/comments.service';
export type {
  CommentData,
  CommentPosition,
  RerumCommentData,
  ResolveThreadResult,
} from './comments/comments.types';

// Instructor service
export { instructorService, InstructorService } from './instructor/instructor.service';
export type {
  StudentInfo,
  ApprovalNoteData,
  ApprovalRequestData,
  SerializedMediaItem,
  SerializedAudioItem,
} from './instructor/instructor.types';

// Media service
export {
  mediaService,
  MediaService,
  getVideoThumbnail,
  getVideoDuration,
} from './media/media.service';

// Tags service
export { tagsService, TagsService } from './tags/tags.service';
