/**
 * Users Service
 *
 * Handles user data operations including fetching, creating, and name resolution.
 * Uses Firebase Firestore as primary storage with RERUM as fallback.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/config/firebase';
import { rerumClient } from '../base/rerum-client';
import type { UserData, RerumAgentData } from './users.types';

class UsersService {
  /**
   * Fetch user by UID. Tries Firestore first, then falls back to RERUM.
   */
  async fetchById(uid: string): Promise<UserData | null> {
    // Try Firestore first
    const firestoreUser = await this.fetchFromFirestore(uid);
    if (firestoreUser) {
      return firestoreUser;
    }

    // Fall back to RERUM
    return this.fetchFromRerum(uid);
  }

  /**
   * Fetch user from Firestore.
   */
  private async fetchFromFirestore(uid: string): Promise<UserData | null> {
    if (!db) {
      console.warn('Firebase db is not initialized');
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        uid: data.uid || uid,
        name: data.name || '',
        email: data.email,
        roles: data.roles || { administrator: false, contributor: false },
        isInstructor: data.isInstructor || false,
        students: data.students || [],
        parentInstructorId: data.parentInstructorId,
      };
    } catch (error) {
      console.warn('Failed to fetch user from Firestore:', error);
      return null;
    }
  }

  /**
   * Fetch user from RERUM API.
   */
  private async fetchFromRerum(uid: string): Promise<UserData | null> {
    try {
      const results = await rerumClient.query<RerumAgentData>({
        $or: [
          { '@type': 'Agent', uid },
          { '@type': 'foaf:Agent', uid },
        ],
      });

      if (!results.length) {
        return null;
      }

      const data = results[0];
      return {
        uid: data.uid,
        name: data.name || data.displayName || '',
        email: data.email,
        roles: data.roles || { administrator: false, contributor: false },
        isInstructor: data.isInstructor || false,
        students: data.students || [],
        parentInstructorId: data.parentInstructorId,
      };
    } catch (error) {
      console.warn('Failed to fetch user from RERUM:', error);
      return null;
    }
  }

  /**
   * Create a new user in RERUM.
   */
  async create(userData: UserData): Promise<RerumAgentData> {
    const response = await rerumClient.create<RerumAgentData>({
      '@type': 'Agent',
      ...userData,
    });

    if (!response.ok) {
      throw new Error('Failed to create user');
    }

    return response.data;
  }

  /**
   * Fetch creator name by ID.
   * Handles both direct UIDs and RERUM URL formats.
   * Returns 'Unknown creator' if not found.
   */
  async fetchCreatorName(creatorId: string): Promise<string> {
    try {
      const normalizedId = this.normalizeCreatorId(creatorId);

      // Try Firestore first
      const firestoreName = await this.getNameFromFirestore(normalizedId);
      if (firestoreName) {
        return firestoreName;
      }

      // Try RERUM direct fetch (if URL)
      if (creatorId.startsWith('http')) {
        const rerumName = await this.getNameFromRerumUrl(creatorId);
        if (rerumName) {
          return rerumName;
        }
      }

      // Fall back to RERUM query
      return await this.getNameFromRerumQuery(normalizedId, creatorId);
    } catch (error) {
      console.warn(`Error fetching creator name for ${creatorId}:`, error);
      return 'Unknown creator';
    }
  }

  /**
   * Normalize creator ID by extracting UID from RERUM URLs.
   */
  private normalizeCreatorId(id: string): string {
    const isRerumUrl =
      id.startsWith('https://devstore.rerum.io/') || id.startsWith('http://devstore.rerum.io/');

    if (isRerumUrl) {
      const parts = id.split('/');
      return parts[parts.length - 1] || id;
    }

    return id;
  }

  /**
   * Try to get user name from Firestore.
   */
  private async getNameFromFirestore(uid: string): Promise<string | null> {
    if (!db) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return data.name?.trim() || data.displayName?.trim() || data.email?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Try to get user name from a RERUM URL directly.
   */
  private async getNameFromRerumUrl(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.name?.trim() || data.displayName?.trim() || data.email?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Query RERUM for user name.
   */
  private async getNameFromRerumQuery(normalizedId: string, originalId: string): Promise<string> {
    // Try with normalized ID first
    let results = await rerumClient.query<RerumAgentData>({
      $or: [
        { '@type': 'Agent', uid: normalizedId },
        { '@type': 'foaf:Agent', uid: normalizedId },
        { '@type': 'Agent', 'wr:uid': normalizedId },
        { '@type': 'foaf:Agent', 'wr:uid': normalizedId },
      ],
    });

    // If no result and IDs differ, try with original
    if (!results.length && normalizedId !== originalId) {
      results = await rerumClient.query<RerumAgentData>({
        $or: [
          { '@type': 'Agent', uid: originalId },
          { '@type': 'foaf:Agent', uid: originalId },
          { '@id': originalId },
        ],
      });
    }

    if (results.length) {
      const result = results[0];
      return (
        result.name?.trim() ||
        result.displayName?.trim() ||
        result.email?.trim() ||
        'Unknown creator'
      );
    }

    return 'Unknown creator';
  }
}

// Export singleton instance
export const usersService = new UsersService();

// Export class for testing
export { UsersService };
