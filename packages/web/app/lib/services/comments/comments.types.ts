/**
 * Type definitions for the Comments service.
 *
 * API response types (CommentResponse, CommentPosition) are auto-derived
 * from the shared Zod schemas in @lrda/shared.
 * Only frontend-specific types are defined here.
 */

// Re-export shared types
export type { CommentPosition, CommentResponse as ApiCommentData } from '@lrda/shared';

/**
 * Frontend comment data structure.
 * Uses `resolved` instead of the API's `isResolved` (field name alignment is a follow-up).
 */
export interface CommentData {
  id: string;
  noteId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  position?: { from: number; to: number } | null;
  threadId?: string | null;
  parentId?: string | null;
  resolved?: boolean;
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
export type RerumCommentData = import('@lrda/shared').CommentResponse;
