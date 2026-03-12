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
import type { AdminUser, PendingApplication, Stats } from '@lrda/shared';

// Re-export shared types with legacy aliases for backward compatibility
export type AdminUserData = AdminUser;
export type { PendingApplication };
export type AdminStats = Stats;

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
