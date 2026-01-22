/**
 * Type definitions for the Users service.
 */

import type { UserProfile as AppUserProfile } from '@/app/types';

// Re-export the main UserProfile type
export type UserProfile = AppUserProfile;

/**
 * User roles in the system (legacy format).
 */
export interface UserRoles {
  administrator: boolean;
  contributor: boolean;
}

/**
 * Legacy user data structure for backward compatibility.
 * @deprecated Use UserProfile instead
 */
export interface UserData {
  uid: string;
  name: string;
  email?: string;
  roles: UserRoles;
  isInstructor?: boolean;
  students?: string[];
  parentInstructorId?: string;
}

/**
 * Options for updating a user profile.
 */
export interface UpdateProfileOptions {
  name?: string;
  image?: string | null;
  isInstructor?: boolean;
  pendingInstructorDescription?: string | null;
}

/**
 * Response from the instructors endpoint.
 */
export interface InstructorInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  createdAt: string;
}
