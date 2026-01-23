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

export { RestClient, restClient, API_URL } from './base/rest-client';

// Notes service
export { notesService, NotesService } from './notes/notes.service';
export type {
  NoteQueryOptions,
  NotesBoundsQuery,
  CreateNotePayload,
  UpdateNotePayload,
  ApiNoteData,
  // Legacy aliases
  RerumNoteData,
} from './notes/notes.types';
export { transformNoteToApi, transformNoteToRerum } from './notes/notes.types';

// Users service
export {
  fetchMe,
  fetchUserById,
  fetchProfileById,
  fetchInstructors,
  updateProfile,
  assignInstructor,
  fetchCreatorName,
} from './users/users.service';
export type {
  UserData,
  UserRoles,
  UserProfile,
  UpdateProfileOptions,
  InstructorInfo,
} from './users/users.types';

// Comments service
export { commentsService, CommentsService } from './comments/comments.service';
export type {
  CommentData,
  CommentPosition,
  ApiCommentData,
  ResolveThreadResult,
  // Legacy alias
  RerumCommentData,
} from './comments/comments.types';

// Instructor service
export {
  fetchStudents,
  requestApproval,
  sendNotification as sendInstructorNotification,
} from './instructor/instructor.service';
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

// Admin service
export {
  fetchAllUsers,
  fetchPendingApplications,
  getStats as getAdminStats,
  approveApplication,
  rejectApplication,
} from './admin/admin.service';
export type { AdminUserData, PendingApplication, AdminStats } from './admin/admin.service';

// API utilities
export { fetchWithAuth } from './api';
