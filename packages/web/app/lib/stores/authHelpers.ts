import type { UserProfile } from '@/app/types';

/**
 * Auth role helper functions.
 *
 * Pure functions for deriving role state from a UserProfile. Use these in
 * React components alongside the `user` selector so components re-render
 * correctly when auth state changes.
 *
 * Separated from authStore.ts to avoid pulling in the auth dependency chain
 * (better-auth, nanostores) in test environments.
 */

export function isInstructorUser(user: UserProfile | null): boolean {
  return !!user?.isInstructor;
}

export function isAdminUser(user: UserProfile | null): boolean {
  return user?.role === 'admin';
}
