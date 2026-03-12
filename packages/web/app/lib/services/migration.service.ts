/**
 * Migration service -- TEMPORARY, remove after Firebase migration is complete.
 *
 * Checks whether a user was migrated from Firebase and needs to set a password
 * before they can log in with Better Auth.
 */

import { fetchWithAuth } from './api';

interface MigrationStatus {
  needsPasswordReset: boolean;
}

/**
 * Check if a user needs to set a password (migrated from Firebase).
 * Returns false for unknown emails to avoid account enumeration.
 */
export async function checkMigrationStatus(email: string): Promise<boolean> {
  try {
    const result = await fetchWithAuth<MigrationStatus>('/api/auth/migration-status', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return result.needsPasswordReset;
  } catch {
    return false;
  }
}
