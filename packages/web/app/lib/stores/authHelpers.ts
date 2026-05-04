/**
 * Auth role helper functions.
 *
 * Pure functions for deriving role state from any user-like object. Accepts
 * both UserProfile (auth store) and AdminUser (admin dashboard) via a
 * structural type so role logic is centralized in one place.
 *
 * Separated from authStore.ts to avoid pulling in the auth dependency chain
 * (better-auth, nanostores) in test environments.
 */

/** Minimal shape required for role checks. */
interface RoleCheckable {
  role?: string | null;
  isInstructor?: boolean;
}

export function isInstructorUser(user: RoleCheckable | null): boolean {
  return !!user?.isInstructor;
}

export function isAdminUser(user: RoleCheckable | null): boolean {
  return user?.role === 'admin';
}

/** True if the user can act with instructor-level privileges (instructor OR admin). */
export function hasInstructorAccess(user: RoleCheckable | null): boolean {
  return isInstructorUser(user) || isAdminUser(user);
}
