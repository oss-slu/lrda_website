/**
 * Services Index
 *
 * Central export point for all services.
 * Import services from this file for cleaner imports:
 *
 * import { notesService, usersService } from '@/app/lib/services';
 */

// API client
export { fetchWithAuth, buildQueryString, API_URL } from './api';

// Notes service
export { notesService } from './notes.service';
export type {
  NoteQueryOptions,
  CreateNotePayload,
  UpdateNotePayload,
  ApiNoteData,
} from './notes.types';

// Users service
export {
  fetchMe,
  fetchProfileById,
  fetchInstructors,
  updateProfile,
  assignInstructor,
  fetchCreatorName,
} from './users.service';
export type {
  UserProfile,
  UpdateProfileOptions,
  InstructorInfo,
} from './users.types';

// Comments service
export { commentsService } from './comments.service';
export type {
  CommentData,
  CommentPosition,
  ApiCommentData,
  ResolveThreadResult,
} from './comments.types';

// Instructor service
export { fetchStudents } from './instructor.service';
export type {
  StudentInfo,
  SerializedMediaItem,
  SerializedAudioItem,
} from './instructor.types';

// Media service
export {
  mediaService,
  getVideoThumbnail,
  getVideoDuration,
} from './media.service';

// Tags service
export { tagsService } from './tags.service';

// Admin service
export {
  fetchAllUsers,
  fetchPendingApplications,
  getStats as getAdminStats,
  approveApplication,
  rejectApplication,
  setUserRole,
  banUser,
  unbanUser,
  removeUser,
} from './admin.service';
export type { AdminUserData, PendingApplication, AdminStats } from './admin.service';
