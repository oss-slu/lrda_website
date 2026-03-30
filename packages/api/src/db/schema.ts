import {
  pgTable,
  text,
  timestamp,
  boolean,
  doublePrecision,
  jsonb,
  type AnyPgColumn,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { Tag, Comment as CommentType } from './types';

// Better Auth required tables + app-specific extensions

export const user = pgTable(
  'user',
  {
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
  },
  table => [index('user_instructor_id_idx').on(table.instructorId)],
);

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

export const session = pgTable(
  'session',
  {
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
  },
  table => [index('session_user_id_idx').on(table.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = pgTable(
  'account',
  {
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
  },
  table => [index('account_user_id_idx').on(table.userId)],
);

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
export const note = pgTable(
  'note',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text('title'),
    text: text('text').notNull().default(''),
    creatorId: text('creator_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    locationName: text('location_name'),
    isPublished: boolean('is_published').notNull().default(false),
    approvalRequested: boolean('approval_requested').notNull().default(false),
    isReturned: boolean('is_returned').notNull().default(false),
    tags: jsonb('tags').$type<Tag[]>().default([]),
    time: timestamp('time').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [
    index('note_creator_id_idx').on(table.creatorId),
    index('note_published_coords_idx').on(table.isPublished, table.latitude, table.longitude),
  ],
);

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
export const media = pgTable(
  'media',
  {
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => [index('media_note_id_idx').on(table.noteId)],
);

export const mediaRelations = relations(media, ({ one }) => ({
  note: one(note, {
    fields: [media.noteId],
    references: [note.id],
  }),
}));

/**
 * Audio table - audio recordings attached to notes
 */
export const audio = pgTable(
  'audio',
  {
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  table => [index('audio_note_id_idx').on(table.noteId)],
);

export const audioRelations = relations(audio, ({ one }) => ({
  note: one(note, {
    fields: [audio.noteId],
    references: [note.id],
  }),
}));

/**
 * Comments table - comments on notes with threading support
 */
export const comment = pgTable(
  'comment',
  {
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
    position: jsonb('position').$type<{ from: number; to: number } | null>(),
    threadId: text('thread_id'),
    parentId: text('parent_id').references((): AnyPgColumn => comment.id, { onDelete: 'cascade' }),
    isResolved: boolean('is_resolved').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  table => [
    index('comment_note_id_idx').on(table.noteId),
    index('comment_author_id_idx').on(table.authorId),
    index('comment_thread_id_idx').on(table.threadId),
  ],
);

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

// ============================================
// Analytics Tables
// ============================================

/**
 * Page view analytics table - tracks anonymous page views
 * Privacy-first: no personal data stored, IPs hashed, UAs parsed not stored
 */
export const pageView = pgTable(
  'page_view',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // What was visited
    path: text('path').notNull(),
    pageTitle: text('page_title'),
    referrer: text('referrer'),
    // UTM campaign tracking (parsed from URL query string)
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    // Visitor context (no personal data)
    browser: text('browser'),
    os: text('os'),
    device: text('device'),
    screenWidth: text('screen_width'),
    language: text('language'),
    // Deduplication
    sessionHash: text('session_hash'),
    // Timestamp
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  table => [
    index('page_view_path_idx').on(table.path),
    index('page_view_created_at_idx').on(table.createdAt),
    index('page_view_session_hash_idx').on(table.sessionHash),
    index('page_view_utm_source_idx').on(table.utmSource),
  ],
);
