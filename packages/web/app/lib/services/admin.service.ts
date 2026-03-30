/**
 * Admin Service
 *
 * Handles admin-specific operations including fetching all users,
 * pending instructor applications, and system statistics.
 *
 * Types are derived from shared Zod schemas in @lrda/shared.
 */

import { fetchWithAuth } from './api';
import { authClient } from '@/app/lib/auth/client';
import type {
  AdminUser,
  PendingApplication,
  Stats,
  ContentStats,
  RecentActivityItem,
} from '@lrda/shared';
import { z } from 'zod';
import { AnalyticsSummarySchema, AnalyticsTimeSeriesSchema } from '@lrda/shared';

// Re-export shared types with legacy aliases for backward compatibility
export type AdminUserData = AdminUser;
export type { PendingApplication, ContentStats, RecentActivityItem };
export type AdminStats = Stats;

// Infer analytics types from Zod schemas
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;
export type TimeSeriesPoint = z.infer<typeof AnalyticsTimeSeriesSchema>[number];

/**
 * Fetch all users from the API.
 */
export async function fetchAllUsers(): Promise<AdminUserData[]> {
  try {
    return await fetchWithAuth<AdminUserData[]>('/api/admin/users');
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

/**
 * Fetch users with pending instructor applications.
 */
export async function fetchPendingApplications(): Promise<PendingApplication[]> {
  try {
    return await fetchWithAuth<PendingApplication[]>('/api/admin/pending-instructors');
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    throw error;
  }
}

/**
 * Get admin statistics.
 */
export async function getStats(): Promise<AdminStats> {
  try {
    return await fetchWithAuth<AdminStats>('/api/admin/stats');
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
}

/**
 * Approve an instructor application.
 */
export async function approveApplication(userId: string): Promise<boolean> {
  try {
    await fetchWithAuth<{ success: boolean }>(`/api/admin/approve-instructor/${userId}`, {
      method: 'POST',
    });
    return true;
  } catch (error) {
    console.error('Error approving application:', error);
    throw error;
  }
}

/**
 * Reject an instructor application.
 */
export async function rejectApplication(userId: string, reason?: string): Promise<boolean> {
  try {
    await fetchWithAuth<{ success: boolean }>(`/api/admin/reject-instructor/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return true;
  } catch (error) {
    console.error('Error rejecting application:', error);
    throw error;
  }
}

/**
 * Get content statistics (note counts).
 */
export async function getContentStats(): Promise<ContentStats> {
  try {
    return await fetchWithAuth<ContentStats>('/api/admin/content-stats');
  } catch (error) {
    console.error('Error fetching content stats:', error);
    throw error;
  }
}

/**
 * Get recent note activity.
 */
export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  try {
    return await fetchWithAuth<RecentActivityItem[]>('/api/admin/recent-activity');
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

/**
 * Set a user's role via Better Auth admin plugin.
 */
export async function setUserRole(userId: string, role: 'admin' | 'user') {
  const result = await authClient.admin.setRole({ userId, role });
  if (result.error) {
    throw new Error(result.error.message || 'Failed to set user role');
  }
  return result.data;
}

/**
 * Ban a user via Better Auth admin plugin.
 */
export async function banUser(userId: string, reason?: string) {
  const result = await authClient.admin.banUser({
    userId,
    banReason: reason,
  });
  if (result.error) {
    throw new Error(result.error.message || 'Failed to ban user');
  }
  return result.data;
}

/**
 * Unban a user via Better Auth admin plugin.
 */
export async function unbanUser(userId: string) {
  const result = await authClient.admin.unbanUser({ userId });
  if (result.error) {
    throw new Error(result.error.message || 'Failed to unban user');
  }
  return result.data;
}

/**
 * Remove a user via Better Auth admin plugin.
 */
export async function removeUser(userId: string) {
  const result = await authClient.admin.removeUser({ userId });
  if (result.error) {
    throw new Error(result.error.message || 'Failed to remove user');
  }
  return result.data;
}

/**
 * Get analytics summary.
 */
export async function getAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  try {
    return await fetchWithAuth<AnalyticsSummary>(`/api/admin/analytics/summary?days=${days}`);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    throw error;
  }
}

/**
 * Get analytics timeseries data.
 */
export async function getAnalyticsTimeseries(days = 30): Promise<TimeSeriesPoint[]> {
  try {
    return await fetchWithAuth<TimeSeriesPoint[]>(`/api/admin/analytics/timeseries?days=${days}`);
  } catch (error) {
    console.error('Error fetching analytics timeseries:', error);
    throw error;
  }
}
