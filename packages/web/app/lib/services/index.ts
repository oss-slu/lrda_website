/**
 * Services Index
 *
 * Central export point for all services.
 * Import services from this file for cleaner imports:
 *
 * import { notesService, fetchCreatorName } from '@/app/lib/services';
 */

// Notes service
export { notesService } from './notes.service';

// Users service
export {
  fetchMe,
  fetchInstructors,
  fetchCreatorName,
} from './users.service';

// Comments service
export { commentsService } from './comments.service';

// Instructor service
export { fetchStudents } from './instructor.service';

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
  getSyncStatus,
  startSync,
  stopSync,
  triggerSync,
  getSyncLog,
  getSyncRunDetail,
  syncUsers,
  getAnalyticsSummary,
  getAnalyticsTimeseries,
} from './admin.service';
export type {
  AdminUserData,
  PendingApplication,
  AdminStats,
  ContentStats,
  RecentActivityItem,
  SyncStatus,
  SyncRun,
  SyncRunWithDetails,
  AnalyticsSummary,
  TimeSeriesPoint,
} from './admin.service';
