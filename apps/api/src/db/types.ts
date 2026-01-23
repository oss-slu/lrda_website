/**
 * Database-related types for the API
 */

/**
 * Tag structure for notes
 */
export interface Tag {
  label: string;
  origin: 'user' | 'ai';
}

/**
 * Position within text content for inline comments
 */
export interface CommentPosition {
  from: number;
  to: number;
}

/**
 * Comment type (simplified for API)
 */
export interface Comment {
  id: string;
  noteId: string;
  text: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  position?: CommentPosition | null;
  threadId?: string | null;
  parentId?: string | null;
  resolved?: boolean;
}
