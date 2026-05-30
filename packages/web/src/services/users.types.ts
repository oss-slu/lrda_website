/**
 * Type definitions for the Users service.
 *
 * User response types are derived from shared schemas in @lrda/shared.
 */

import type { UserProfile as AppUserProfile } from '@/types';

// Re-export the main UserProfile type
export type UserProfile = AppUserProfile;

// Re-export shared types for direct use
export type { PublicUser, UserDetail } from '@lrda/shared';

/**
 * Options for updating a user profile.
 */
export interface UpdateProfileOptions {
  name?: string;
  image?: string | null;
  isInstructor?: boolean;
  pendingInstructorDescription?: string | null;
}

export interface InstructorInfo {
  id: string;
  name: string;
  image?: string | null;
  createdAt: string;
}
