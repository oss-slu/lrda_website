/**
 * Admin Service
 *
 * Handles admin-specific operations including fetching all users,
 * pending instructor applications, and system statistics.
 */

import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import {
  approveInstructorApplication,
  rejectInstructorApplication,
} from '@/app/lib/utils/adminToInstructor';

export interface AdminUserData {
  uid: string;
  name: string;
  email: string;
  createdAt: Date;
  roles: {
    administrator: boolean;
    contributor: boolean;
  };
  isInstructor: boolean;
  pendingInstructorDescription?: string;
  students?: string[];
}

export interface PendingApplication {
  uid: string;
  name: string;
  email: string;
  description: string;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalInstructors: number;
  totalContributors: number;
  pendingApplications: number;
}

class AdminService {
  /**
   * Fetch all users from Firestore.
   */
  async fetchAllUsers(): Promise<AdminUserData[]> {
    if (!db) {
      throw new Error('Firebase db is not initialized');
    }

    try {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);

      const users: AdminUserData[] = [];

      usersSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          uid: data.uid || doc.id,
          name: data.name || 'Unknown',
          email: data.email || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          roles: data.roles || { administrator: false, contributor: false },
          isInstructor: data.isInstructor || false,
          pendingInstructorDescription: data.pendingInstructorDescription,
          students: data.students || [],
        });
      });

      // Sort by creation date (newest first)
      users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return users;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Fetch users with pending instructor applications.
   */
  async fetchPendingApplications(): Promise<PendingApplication[]> {
    if (!db) {
      throw new Error('Firebase db is not initialized');
    }

    try {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('pendingInstructorDescription', '!=', null));
      const snapshot = await getDocs(q);

      const applications: PendingApplication[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.pendingInstructorDescription && !data.isInstructor) {
          applications.push({
            uid: data.uid || doc.id,
            name: data.name || 'Unknown',
            email: data.email || '',
            description: data.pendingInstructorDescription,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          });
        }
      });

      // Sort by creation date (oldest first - FIFO for approvals)
      applications.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return applications;
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      throw error;
    }
  }

  /**
   * Get admin statistics.
   */
  async getStats(): Promise<AdminStats> {
    const users = await this.fetchAllUsers();

    return {
      totalUsers: users.length,
      totalAdmins: users.filter(u => u.roles?.administrator).length,
      totalInstructors: users.filter(u => u.isInstructor).length,
      totalContributors: users.filter(u => u.roles?.contributor && !u.roles?.administrator).length,
      pendingApplications: users.filter(u => u.pendingInstructorDescription && !u.isInstructor)
        .length,
    };
  }

  /**
   * Approve an instructor application.
   */
  async approveApplication(userUid: string, adminUid: string, adminName: string): Promise<boolean> {
    return approveInstructorApplication(userUid, adminUid, adminName);
  }

  /**
   * Reject an instructor application.
   */
  async rejectApplication(userUid: string, adminUid: string, reason: string): Promise<boolean> {
    return rejectInstructorApplication(userUid, adminUid, reason);
  }
}

// Export singleton instance
export const adminService = new AdminService();

// Export class for testing
export { AdminService };
