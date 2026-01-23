import { pgTable, text, timestamp, boolean, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { Tag, Comment as CommentType } from './types';

// Better Auth required tables + app-specific extensions

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  // Admin plugin fields
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),

  // App-specific fields
  isInstructor: boolean('is_instructor').notNull().default(false),
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

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// Content Tables (Notes, Media, Audio, Comments)
// ============================================

/**
 * Notes table - main content entity
 */
export const note = pgTable('note', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  text: text('text').notNull().default(''),
  creatorId: text('creator_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  isPublished: boolean('is_published').notNull().default(false),
  approvalRequested: boolean('approval_requested').notNull().default(false),
  tags: jsonb('tags').$type<Tag[]>().default([]),
  time: timestamp('time').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
export const media = pgTable('media', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  noteId: text('note_id')
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'image' or 'video'
  uri: text('uri').notNull(),
  thumbnailUri: text('thumbnail_uri'),
  uuid: text('uuid'), // Original UUID from mobile app
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const mediaRelations = relations(media, ({ one }) => ({
  note: one(note, {
    fields: [media.noteId],
    references: [note.id],
  }),
}));

/**
 * Audio table - audio recordings attached to notes
 */
export const audio = pgTable('audio', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  noteId: text('note_id')
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(),
  name: text('name'),
  duration: text('duration'),
  uuid: text('uuid'), // Original UUID from mobile app
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const audioRelations = relations(audio, ({ one }) => ({
  note: one(note, {
    fields: [audio.noteId],
    references: [note.id],
  }),
}));

/**
 * Comments table - comments on notes with threading support
 */
export const comment = pgTable('comment', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  noteId: text('note_id')
    .notNull()
    .references(() => note.id, { onDelete: 'cascade' }),
  authorId: text('author_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  authorName: text('author_name').notNull(), // Denormalized for display
  text: text('text').notNull(),
  position: jsonb('position').$type<{ from: number; to: number } | null>(),
  threadId: text('thread_id'),
  parentId: text('parent_id').references((): any => comment.id, { onDelete: 'cascade' }),
  isResolved: boolean('is_resolved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
