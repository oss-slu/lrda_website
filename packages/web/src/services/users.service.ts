/**
 * Users Service
 *
 * Handles user data operations via the API.
 * All data is stored in D1 via the Hono API backend.
 */

import type { UserProfile, InstructorInfo } from './users.types';
import { fetchWithAuth } from './api';

/**
 * Fetch the current authenticated user's profile.
 */
export async function fetchMe(): Promise<UserProfile | null> {
  try {
    return await fetchWithAuth<UserProfile>('/api/users/me');
  } catch (error) {
    console.warn('Failed to fetch current user:', error);
    return null;
  }
}

/**
 * Fetch user profile by ID (new format).
 */
async function fetchProfileById(id: string): Promise<UserProfile | null> {
  try {
    return await fetchWithAuth<UserProfile>(`/api/users/${id}`);
  } catch (error) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }
}

export async function fetchInstructors(search?: string): Promise<InstructorInfo[]> {
  try {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return await fetchWithAuth<InstructorInfo[]>(`/api/users/instructors${params}`);
  } catch (error) {
    console.warn('Failed to fetch instructors:', error);
    return [];
  }
}

/**
 * Fetch creator name by ID.
 * Returns 'Unknown creator' if not found.
 */
export async function fetchCreatorName(creatorId: string): Promise<string> {
  try {
    const profile = await fetchProfileById(creatorId);
    if (profile) {
      return profile.name || profile.email || 'Unknown creator';
    }
    return 'Unknown creator';
  } catch (error) {
    console.warn(`Error fetching creator name for ${creatorId}:`, error);
    return 'Unknown creator';
  }
}
