// Temporary bridge for Firebase password sync during migration.
// The reset-password Hono handler stashes the plaintext password here
// (keyed by user email) before forwarding to Better Auth. The
// onPasswordReset callback in auth.ts consumes and deletes the entry.
// Remove this file when the mobile app migrates off Firebase Auth.

const pending = new Map<string, string>();

export function stashPassword(email: string, plaintext: string) {
  pending.set(email, plaintext);
}

export function consumePassword(email: string): string | undefined {
  const pw = pending.get(email);
  if (pw !== undefined) pending.delete(email);
  return pw;
}
