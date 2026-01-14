/**
 * Type definitions for the Comments service.
 */

import type { ReactNode } from 'react';

/**
 * Position within text content for inline comments.
 */
export interface CommentPosition {
  from: number;
  to: number;
}

/**
 * Comment data structure.
 */
export interface CommentData {
  id?: string;
  noteId: string;
  text: string;
  authorId: string;
  authorName: string | ReactNode;
  author?: string;
  createdAt: string;
  position?: CommentPosition | null;
  threadId?: string | null;
  parentId?: string | null;
  resolved?: boolean;
  archived?: boolean;
}

/**
 * Raw comment data from RERUM.
 */
export interface RerumCommentData {
  '@id': string;
  type: string;
  noteId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  position?: CommentPosition;
  threadId?: string;
  parentId?: string;
  resolved?: boolean;
  archived?: boolean;
  resolvedAt?: string;
  archivedAt?: string;
}

/**
 * Result of resolving a thread.
 */
export interface ResolveThreadResult {
  success: boolean;
  updatedCount: number;
}
