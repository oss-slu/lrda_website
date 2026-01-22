/**
 * Admin Service
 *
 * Handles admin-specific operations including fetching all users,
 * pending instructor applications, and system statistics.
 */

import { fetchWithAuth } from '../api';

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
  isInstructor: boolean;
  pendingInstructorDescription?: string | null;
  createdAt: Date | string;
}

export interface PendingApplication {
  id: string;
  name: string;
  email: string;
  description: string;
  createdAt: Date | string;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalInstructors: number;
  pendingApplications: number;
}

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
