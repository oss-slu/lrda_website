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
 * Comment data from REST API.
 */
export interface ApiCommentData {
  id: string;
  noteId: string;
  authorId: string;
  authorName: string;
  text: string;
  position?: CommentPosition | null;
  threadId?: string | null;
  parentId?: string | null;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Result of resolving a thread.
 */
export interface ResolveThreadResult {
  success: boolean;
  updatedCount: number;
}

// Legacy type alias for backward compatibility
/** @deprecated Use ApiCommentData instead */
export type RerumCommentData = ApiCommentData;
