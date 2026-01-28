/**
 * Comments Service
 *
 * Handles comment operations including CRUD, thread resolution, and deletion.
 * Uses the REST API backend (Hono/PostgreSQL).
 */

import { Comment } from '@/app/types';
import { restClient } from '../base/rest-client';
import type { CommentData, ApiCommentData, ResolveThreadResult } from './comments.types';

class CommentsService {
  /**
   * Fetch all comments for a specific note.
   */
  async fetchForNote(noteId: string): Promise<CommentData[]> {
    try {
      const response = await restClient.get<ApiCommentData[]>(`/api/comments/note/${noteId}`);
      return response.data.map(this.transformComment);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Create a new comment.
   * Accepts the app's Comment type for compatibility.
   */
  async create(comment: Comment | CommentData): Promise<ApiCommentData> {
    const payload = {
      noteId: comment.noteId,
      text: comment.text,
      position: comment.position || null,
      threadId: comment.threadId || null,
      parentId: comment.parentId || null,
    };

    const response = await restClient.post<ApiCommentData>('/api/comments', payload);

    if (!response.ok) {
      throw new Error('Failed to create comment');
    }

    return response.data;
  }

  /**
   * Resolve all comments in a thread.
   */
  async resolveThread(threadId: string): Promise<ResolveThreadResult> {
    const response = await restClient.post<ResolveThreadResult>(
      `/api/comments/thread/${threadId}/resolve`,
      {},
    );

    if (!response.ok) {
      throw new Error('Failed to resolve thread');
    }

    return response.data;
  }

  /**
   * Delete a comment (hard delete).
   */
  async delete(commentId: string): Promise<boolean> {
    const response = await restClient.delete<void>(`/api/comments/${commentId}`);
    return response.status === 204 || response.ok;
  }

  /**
   * Archive a comment.
   * @deprecated Use delete() instead - we now use hard deletes.
   */
  async archive(commentId: string): Promise<boolean> {
    return this.delete(commentId);
  }

  /**
   * Update a comment's text.
   */
  async update(commentId: string, updates: Partial<CommentData>): Promise<ApiCommentData> {
    const payload: Record<string, unknown> = {};
    if (updates.text !== undefined) payload.text = updates.text;
    if (updates.resolved !== undefined) payload.isResolved = updates.resolved;

    const response = await restClient.patch<ApiCommentData>(`/api/comments/${commentId}`, payload);

    if (!response.ok) {
      throw new Error('Failed to update comment');
    }

    return response.data;
  }

  /**
   * Transform API comment data to internal format.
   */
  private transformComment(item: ApiCommentData): CommentData {
    return {
      id: item.id,
      noteId: item.noteId,
      text: item.text,
      authorId: item.authorId,
      authorName: item.authorName,
      createdAt: new Date(item.createdAt).toISOString(),
      position: item.position ? { from: item.position.from, to: item.position.to } : null,
      threadId: item.threadId || null,
      parentId: item.parentId || null,
      resolved: item.isResolved,
      archived: false, // No longer using archive
    };
  }
}

// Export singleton instance
export const commentsService = new CommentsService();

// Export class for testing
export { CommentsService };
