// Temporary bridge for Firebase password sync during migration.
// The reset-password Hono handler stashes the plaintext password here
// (keyed by user email) before forwarding to Better Auth. The
// onPasswordReset callback in auth.ts consumes and deletes the entry.
// Remove this file when the mobile app migrates off Firebase Auth.

const STASH_TTL_MS = 5 * 60 * 1000;

const pending = new Map<string, { plaintext: string; timer: ReturnType<typeof setTimeout> }>();

export function stashPassword(email: string, plaintext: string) {
  const existing = pending.get(email);
  if (existing) clearTimeout(existing.timer);

  const timer = setTimeout(() => pending.delete(email), STASH_TTL_MS);
  pending.set(email, { plaintext, timer });
}

export function consumePassword(email: string): string | undefined {
  const entry = pending.get(email);
  if (!entry) return undefined;
  clearTimeout(entry.timer);
  pending.delete(email);
  return entry.plaintext;
}
