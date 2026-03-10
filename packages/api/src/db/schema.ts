import { sqliteTable, text, integer, real, index, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import type { Tag, Comment as CommentType } from './types';

// Better Auth required tables + app-specific extensions

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),

  // Admin plugin fields
  role: text('role').default('user'),
  banned: integer('banned', { mode: 'boolean' }).default(false),
  banReason: text('ban_reason'),
  banExpires: integer('ban_expires', { mode: 'timestamp' }),

  // App-specific fields
  isInstructor: integer('is_instructor', { mode: 'boolean' }).notNull().default(false),
  instructorId: text('instructor_id').references((): any => user.id, {
    onDelete: 'set null',
  }),
  pendingInstructorDescription: text('pending_instructor_description'),
});

export const userRelations = relations(user, ({ one, many }) => ({
  instructor: one(user, {
    fields: [user.instructorId],
    references: [user.id],
    relationName: 'instructorStudents',
  }),
  students: many(user, {
    relationName: 'instructorStudents',
  }),
  sessions: many(session),
  accounts: many(account),
  notes: many(note),
  comments: many(comment),
}));

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Admin plugin fields
  impersonatedBy: text('impersonated_by'),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// ============================================
// Content Tables (Notes, Media, Audio, Comments)
// ============================================

/**
 * Notes table - main content entity
 */
export const note = sqliteTable('note', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  text: text('text').notNull().default(''),
  creatorId: text('creator_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  latitude: real('latitude'),
  longitude: real('longitude'),
  locationName: text('location_name'),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  approvalRequested: integer('approval_requested', { mode: 'boolean' }).notNull().default(false),
  isReturned: integer('is_returned', { mode: 'boolean' }).notNull().default(false),
  tags: text('tags', { mode: 'json' }).$type<Tag[]>().default([]),
  time: integer('time', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('note_creator_id_idx').on(table.creatorId),
]);

export const noteRelations = relations(note, ({ one, many }) => ({
  creator: one(user, {
    fields: [note.creatorId],
    references: [user.id],
  }),
  media: many(media),
  audio: many(audio),
  comments: many(comment),
}));

/**
 * Media table - images and videos attached to notes
 */
export const media = sqliteTable('media', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  noteId: text('note_id')
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image' or 'video'
  uri: text('uri').notNull(),
  thumbnailUri: text('thumbnail_uri'),
  uuid: text('uuid'), // Original UUID from mobile app
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('media_note_id_idx').on(table.noteId),
]);

export const mediaRelations = relations(media, ({ one }) => ({
  note: one(note, {
    fields: [media.noteId],
    references: [note.id],
  }),
}));

/**
 * Audio table - audio recordings attached to notes
 */
export const audio = sqliteTable('audio', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  noteId: text('note_id')
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(),
  name: text('name'),
  duration: text('duration'),
  uuid: text('uuid'), // Original UUID from mobile app
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('audio_note_id_idx').on(table.noteId),
]);

export const audioRelations = relations(audio, ({ one }) => ({
  note: one(note, {
    fields: [audio.noteId],
    references: [note.id],
  }),
}));

/**
 * Comments table - comments on notes with threading support
 */
export const comment = sqliteTable('comment', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  noteId: text('note_id')
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(), // Denormalized for display
  text: text('text').notNull(),
  position: text('position', { mode: 'json' }).$type<{ from: number; to: number } | null>(),
  threadId: text('thread_id'),
  parentId: text('parent_id').references((): AnySQLiteColumn => comment.id, { onDelete: 'cascade' }),
  isResolved: integer('is_resolved', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index('comment_note_id_idx').on(table.noteId),
  index('comment_author_id_idx').on(table.authorId),
]);

export const commentRelations = relations(comment, ({ one, many }) => ({
  note: one(note, {
    fields: [comment.noteId],
    references: [note.id],
  }),
  author: one(user, {
    fields: [comment.authorId],
    references: [user.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: 'replies',
  }),
  replies: many(comment, {
    relationName: 'replies',
  }),
}));
