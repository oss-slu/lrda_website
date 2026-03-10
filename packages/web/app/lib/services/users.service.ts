/**
 * Users Service
 *
 * Handles user data operations via the API.
 * All data is stored in D1 via the Hono API backend.
 */

import type { UserProfile, UpdateProfileOptions, InstructorInfo } from './users.types';
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
export async function fetchProfileById(id: string): Promise<UserProfile | null> {
  try {
    return await fetchWithAuth<UserProfile>(`/api/users/${id}`);
  } catch (error) {
    console.warn('Failed to fetch user profile:', error);
    return null;
  }
}

/**
 * Fetch all instructors.
 */
export async function fetchInstructors(): Promise<InstructorInfo[]> {
  try {
    return await fetchWithAuth<InstructorInfo[]>('/api/users/instructors');
  } catch (error) {
    console.warn('Failed to fetch instructors:', error);
    return [];
  }
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(data: UpdateProfileOptions): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Assign an instructor to the current user.
 */
export async function assignInstructor(instructorId: string): Promise<void> {
  await fetchWithAuth('/api/users/me/instructor', {
    method: 'POST',
    body: JSON.stringify({ instructorId }),
  });
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
