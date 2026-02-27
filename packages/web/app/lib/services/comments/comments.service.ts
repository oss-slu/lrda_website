/**
 * Comments Service
 *
 * Handles comment operations including CRUD, thread resolution, and deletion.
 * Uses the REST API backend (Hono/PostgreSQL).
 */

import { fetchWithAuth } from '../api';
import type { CommentData, ApiCommentData, ResolveThreadResult } from './comments.types';

class CommentsService {
  /**
   * Fetch all comments for a specific note.
   */
  async fetchForNote(noteId: string): Promise<CommentData[]> {
    try {
      const data = await fetchWithAuth<ApiCommentData[]>(`/api/comments/note/${noteId}`);
      return (data ?? []).map(this.transformComment);
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Create a new comment.
   * Accepts the app's Comment type for compatibility.
   */
  async create(comment: CommentData): Promise<ApiCommentData> {
    return fetchWithAuth<ApiCommentData>('/api/comments', {
      method: 'POST',
      body: JSON.stringify({
        noteId: comment.noteId,
        text: comment.text,
        position: comment.position || null,
        threadId: comment.threadId || null,
        parentId: comment.parentId || null,
      }),
    });
  }

  /**
   * Resolve all comments in a thread.
   */
  async resolveThread(threadId: string): Promise<ResolveThreadResult> {
    return fetchWithAuth<ResolveThreadResult>(
      `/api/comments/thread/${threadId}/resolve`,
      { method: 'POST' },
    );
  }

  /**
   * Delete a comment (hard delete).
   */
  async delete(commentId: string): Promise<boolean> {
    await fetchWithAuth<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
    return true;
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

    return fetchWithAuth<ApiCommentData>(`/api/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
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
      updatedAt: new Date(item.updatedAt).toISOString(),
      position: item.position ? { from: item.position.from, to: item.position.to } : null,
      threadId: item.threadId || null,
      parentId: item.parentId || null,
      resolved: item.isResolved,
    };
  }
}

// Export singleton instance
export const commentsService = new CommentsService();

// Export class for testing
export { CommentsService };
