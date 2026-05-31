import { fetchWithAuth } from './api';
import type { CommentResponse, CommentPosition } from '@lrda/shared';

export type { CommentPosition };
export type ApiCommentData = CommentResponse;

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

export interface ResolveThreadResult {
  success: boolean;
  updatedCount: number;
}

function transformComment(item: ApiCommentData): CommentData {
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

export async function fetchCommentsForNote(noteId: string): Promise<CommentData[]> {
  try {
    const data = await fetchWithAuth<ApiCommentData[]>(`/api/comments/note/${noteId}`);
    return data.map(transformComment);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function createComment(comment: CommentData): Promise<ApiCommentData> {
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

export async function resolveThread(threadId: string): Promise<ResolveThreadResult> {
  return fetchWithAuth<ResolveThreadResult>(`/api/comments/thread/${threadId}/resolve`, {
    method: 'POST',
  });
}

export async function deleteComment(commentId: string): Promise<boolean> {
  await fetchWithAuth<void>(`/api/comments/${commentId}`, { method: 'DELETE' });
  return true;
}

export async function updateComment(
  commentId: string,
  updates: Partial<CommentData>,
): Promise<ApiCommentData> {
  const payload: Record<string, unknown> = {};
  if (updates.text !== undefined) payload.text = updates.text;
  if (updates.resolved !== undefined) payload.isResolved = updates.resolved;

  return fetchWithAuth<ApiCommentData>(`/api/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
