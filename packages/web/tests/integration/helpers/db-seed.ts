const API_URL = () => process.env.__TEST_API_URL || 'http://localhost:3002';

// Stable test IDs (deterministic UUIDs for test data)
export const TEST_USER_ID = '00000000-e2e0-4000-a000-000000000001';
export const TEST_USER_ID_2 = '00000000-e2e0-4000-a000-000000000002';
export const TEST_ADMIN_ID = '00000000-e2e0-4000-a000-000000000003';
export const TEST_INSTRUCTOR_ID = '00000000-e2e0-4000-a000-000000000004';
export const TEST_NOTE_DRAFT_ID = '00000000-e2e0-4000-b000-000000000001';
export const TEST_NOTE_PUBLISHED_ID = '00000000-e2e0-4000-b000-000000000002';
export const TEST_NOTE_USER2_ID = '00000000-e2e0-4000-b000-000000000003';

/**
 * Execute a raw SQL query via the test endpoint, returning rows.
 */
export async function queryAll<T = Record<string, unknown>>(
  sqlText: string,
  ...params: unknown[]
): Promise<T[]> {
  const res = await fetch(`${API_URL()}/api/test?action=query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: sqlText, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Test query failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return (data.rows ?? []) as T[];
}

/**
 * Execute a raw SQL query and return the first row.
 */
export async function queryOne<T = Record<string, unknown>>(
  sqlText: string,
  ...params: unknown[]
): Promise<T | null> {
  const rows = await queryAll<T>(sqlText, ...params);
  return rows[0] ?? null;
}

/**
 * Execute a raw SQL statement (INSERT/UPDATE/DELETE) via the test endpoint.
 */
export async function execute(sqlText: string, ...params: unknown[]): Promise<void> {
  const res = await fetch(`${API_URL()}/api/test?action=execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: sqlText, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Test execute failed (${res.status}): ${text}`);
  }
}

/**
 * Seed all test data: users, notes, media.
 */
export async function seedTestData(): Promise<void> {
  // Clean up any leftover test data first
  await resetTestData();

  // Insert test users (instructor must come before student who references them)
  await execute(
    `INSERT INTO "user" (id, name, email, email_verified, role, is_instructor, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, $4, $5, NOW(), NOW())`,
    TEST_USER_ID,
    'Test User',
    'testuser@e2e.test',
    'user',
    false,
  );

  await execute(
    `INSERT INTO "user" (id, name, email, email_verified, role, is_instructor, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, $4, $5, NOW(), NOW())`,
    TEST_ADMIN_ID,
    'Test Admin',
    'admin@e2e.test',
    'admin',
    false,
  );

  await execute(
    `INSERT INTO "user" (id, name, email, email_verified, role, is_instructor, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, $4, $5, NOW(), NOW())`,
    TEST_INSTRUCTOR_ID,
    'Test Instructor',
    'instructor@e2e.test',
    'user',
    true,
  );

  // Student with instructor FK -- must come after instructor insert
  await execute(
    `INSERT INTO "user" (id, name, email, email_verified, role, is_instructor, instructor_id, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, $4, $5, $6, NOW(), NOW())`,
    TEST_USER_ID_2,
    'Test User 2',
    'testuser2@e2e.test',
    'user',
    false,
    TEST_INSTRUCTOR_ID,
  );

  // Insert test notes
  await execute(
    `INSERT INTO "note" (id, title, text, creator_id, is_published, latitude, longitude, created_at, updated_at, time)
     VALUES ($1, $2, $3, $4, FALSE, 38.627, -90.199, NOW(), NOW(), NOW())`,
    TEST_NOTE_DRAFT_ID,
    'Draft Note',
    'This is a draft note for testing.',
    TEST_USER_ID,
  );

  await execute(
    `INSERT INTO "note" (id, title, text, creator_id, is_published, latitude, longitude, created_at, updated_at, time)
     VALUES ($1, $2, $3, $4, TRUE, 38.627, -90.199, NOW(), NOW(), NOW())`,
    TEST_NOTE_PUBLISHED_ID,
    'Published Note',
    'This is a published note for testing.',
    TEST_USER_ID,
  );

  await execute(
    `INSERT INTO "note" (id, title, text, creator_id, is_published, latitude, longitude, created_at, updated_at, time)
     VALUES ($1, $2, $3, $4, FALSE, 40.712, -74.006, NOW(), NOW(), NOW())`,
    TEST_NOTE_USER2_ID,
    'User 2 Draft',
    'This is user 2 draft note.',
    TEST_USER_ID_2,
  );
}

/**
 * Remove all test data, respecting FK constraints.
 * Deletes in reverse dependency order.
 */
export async function resetTestData(): Promise<void> {
  const testUserIds = [TEST_USER_ID, TEST_USER_ID_2, TEST_ADMIN_ID, TEST_INSTRUCTOR_ID];
  const testNoteIds = [TEST_NOTE_DRAFT_ID, TEST_NOTE_PUBLISHED_ID, TEST_NOTE_USER2_ID];

  // Delete comments on test notes
  for (const noteId of testNoteIds) {
    await execute(`DELETE FROM "comment" WHERE note_id = $1`, noteId);
  }

  // Delete media/audio on test notes
  for (const noteId of testNoteIds) {
    await execute(`DELETE FROM "media" WHERE note_id = $1`, noteId);
    await execute(`DELETE FROM "audio" WHERE note_id = $1`, noteId);
  }

  // Delete test notes (also catches any notes created during tests by test users)
  for (const userId of testUserIds) {
    await execute(`DELETE FROM "note" WHERE creator_id = $1`, userId);
  }

  // Delete sessions for test users
  for (const userId of testUserIds) {
    await execute(`DELETE FROM "session" WHERE user_id = $1`, userId);
  }

  // Delete accounts for test users
  for (const userId of testUserIds) {
    await execute(`DELETE FROM "account" WHERE user_id = $1`, userId);
  }

  // Delete test users (must clear instructor_id FK first)
  await execute(
    `UPDATE "user" SET instructor_id = NULL WHERE instructor_id IN ($1, $2, $3, $4)`,
    ...testUserIds,
  );
  for (const userId of testUserIds) {
    await execute(`DELETE FROM "user" WHERE id = $1`, userId);
  }
}
