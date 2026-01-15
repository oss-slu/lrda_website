/**
 * Comments Service
 *
 * Handles comment operations including CRUD, thread resolution, and archiving.
 * Uses RERUM as the backend storage.
 */

import { Comment } from '@/app/types';
import { rerumClient } from '../base/rerum-client';
import type { CommentData, RerumCommentData, ResolveThreadResult } from './comments.types';

class CommentsService {
  /**
   * Fetch all comments for a specific note.
   * Filters out archived comments.
   */
  async fetchForNote(noteId: string): Promise<CommentData[]> {
    try {
      const results = await rerumClient.query<RerumCommentData>({
        type: 'comment',
        noteId,
      });

      return results.filter(item => !item.archived).map(item => this.transformComment(item));
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  /**
   * Create a new comment.
   * Accepts the app's Comment type for compatibility.
   */
  async create(comment: Comment | CommentData): Promise<RerumCommentData> {
    // Extract authorName as string if it's a ReactNode
    const authorNameStr =
      typeof comment.authorName === 'string' ?
        comment.authorName
      : String(comment.authorName || comment.author || '');

    const response = await rerumClient.create<RerumCommentData>({
      type: 'comment',
      noteId: comment.noteId,
      text: comment.text,
      authorId: comment.authorId,
      authorName: authorNameStr,
      createdAt: comment.createdAt,
      position: comment.position || null,
      threadId: comment.threadId || null,
      parentId: comment.parentId || null,
      resolved: !!comment.resolved,
      archived: !!comment.archived,
    });

    if (!response.ok) {
      throw new Error('Failed to create comment');
    }

    return response.data;
  }

  /**
   * Resolve all comments in a thread.
   */
  async resolveThread(threadId: string): Promise<ResolveThreadResult> {
    // Fetch all comments in this thread
    const comments = await rerumClient.query<RerumCommentData>({
      type: 'comment',
      threadId,
    });

    if (!comments.length) {
      throw new Error('No comments found for this thread');
    }

    // Update each comment to mark as resolved
    const updatePromises = comments.map(comment =>
      rerumClient.overwrite({
        ...comment,
        resolved: true,
        resolvedAt: new Date().toISOString(),
      }),
    );

    const responses = await Promise.all(updatePromises);
    const failed = responses.filter(r => !r.ok);

    if (failed.length) {
      throw new Error(`Failed to resolve ${failed.length} comment(s) in thread`);
    }

    return { success: true, updatedCount: comments.length };
  }

  /**
   * Archive a comment (soft delete).
   */
  async archive(commentId: string): Promise<boolean> {
    const response = await rerumClient.overwrite({
      type: 'comment',
      '@id': commentId,
      archived: true,
      archivedAt: new Date().toISOString(),
    });

    if (!response.ok) {
      throw new Error('Failed to archive comment');
    }

    return true;
  }

  /**
   * Update a comment's text.
   */
  async update(commentId: string, updates: Partial<CommentData>): Promise<RerumCommentData> {
    const response = await rerumClient.overwrite<RerumCommentData>({
      type: 'comment',
      '@id': commentId,
      ...updates,
    });

    if (!response.ok) {
      throw new Error('Failed to update comment');
    }

    return response.data;
  }

  /**
   * Transform RERUM comment data to internal format.
   */
  private transformComment(item: RerumCommentData): CommentData {
    return {
      id: item['@id'],
      noteId: item.noteId,
      text: item.text,
      authorId: item.authorId,
      authorName: item.authorName,
      createdAt: new Date(item.createdAt).toISOString(),
      position: item.position ? { from: item.position.from, to: item.position.to } : null,
      threadId: item.threadId || null,
      parentId: item.parentId || null,
      resolved: !!item.resolved,
      archived: !!item.archived,
    };
  }
}

// Export singleton instance
export const commentsService = new CommentsService();

// Export class for testing
export { CommentsService };
