-- One-time migration: set email_verified = true for all users who were
-- migrated from Firebase and have no credential account yet.
--
-- Without this, Better Auth's requireEmailVerification blocks sign-in
-- even after the user sets a password via the reset flow.
--
-- Safe to run multiple times (idempotent).
--
-- Usage:
--   psql $DATABASE_URL -f packages/api/src/scripts/mark-migrated-users-verified.sql

UPDATE "user"
SET email_verified = true
WHERE id NOT IN (
  SELECT user_id FROM account WHERE provider_id = 'credential'
)
AND email_verified = false;
