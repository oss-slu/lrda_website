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
export type { NoteQueryOptions, CreateNotePayload, ApiNoteData } from './notes.types';

// Users service
export {
  fetchMe,
  fetchProfileById,
  fetchInstructors,
  updateProfile,
  assignInstructor,
  fetchCreatorName,
} from './users.service';
export type { UserProfile, UpdateProfileOptions, InstructorInfo } from './users.types';

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
export type { StudentInfo } from './instructor.types';

// Media service
export { mediaService, getVideoThumbnail, getVideoDuration } from './media.service';

// Tags service
export { tagsService } from './tags.service';

// Writing assistant service
export { writingAssistantService } from './writing-assistant.service';
export type { WritingAssistantMessage } from './writing-assistant.service';

// Migration service -- TEMPORARY, remove after Firebase migration
export { checkMigrationStatus } from './migration.service';

// Admin service
export {
  fetchAllUsers,
  fetchPendingApplications,
  getStats as getAdminStats,
  getContentStats,
  getRecentActivity,
  approveApplication,
  rejectApplication,
  setUserRole,
  banUser,
  unbanUser,
  removeUser,
  getAnalyticsSummary,
  getAnalyticsTimeseries,
} from './admin.service';
export type {
  AdminUserData,
  PendingApplication,
  AdminStats,
  ContentStats,
  RecentActivityItem,
  AnalyticsSummary,
  TimeSeriesPoint,
} from './admin.service';
