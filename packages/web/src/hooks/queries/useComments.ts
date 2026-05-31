import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import type { CommentData } from '@/services/comments.service';
import {
  fetchCommentsForNote,
  createComment as createCommentApi,
  resolveThread as resolveThreadApi,
  deleteComment as deleteCommentApi,
} from '@/services/comments.service';
import { fetchCreatorName } from '@/services/users.service';

export const commentsKeys = {
  all: ['comments'] as const,
  forNote: (noteId: string) => [...commentsKeys.all, noteId] as const,
};

/**
 * Enriches comments with author display names
 * Resolves proper display names when authorName is missing or contains an email
 */
async function enrichCommentsWithAuthorNames(comments: CommentData[]): Promise<CommentData[]> {
  return Promise.all(
    comments.map(async comment => {
      const needsName = !comment.authorName || comment.authorName.includes('@');

      if (needsName && comment.authorId) {
        try {
          const displayName = await fetchCreatorName(comment.authorId);
          return { ...comment, authorName: displayName };
        } catch {
          return comment;
        }
      }
      return comment;
    }),
  );
}

/**
 * Query options for a note's comments (enriched with author display names).
 */
export function commentsOptions(noteId: string) {
  return queryOptions({
    queryKey: commentsKeys.forNote(noteId),
    queryFn: async (): Promise<CommentData[]> => {
      const raw = await fetchCommentsForNote(noteId);
      return enrichCommentsWithAuthorNames(raw);
    },
  });
}

/**
 * Hook for fetching comments for a note with automatic polling
 * Polls every 15 seconds when the page is visible
 */
export function useComments(noteId: string | null) {
  return useQuery({
    ...commentsOptions(noteId ?? ''),
    enabled: !!noteId,
    refetchInterval: 15000, // Poll every 15 seconds
    refetchIntervalInBackground: false, // Pause when tab is hidden
  });
}

/**
 * Hook for comment mutations (create, resolve, delete)
 */
export function useCommentMutations(noteId: string) {
  const queryClient = useQueryClient();

  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: commentsKeys.forNote(noteId) });
  };

  const createComment = useMutation({
    mutationFn: async (comment: CommentData) => {
      await createCommentApi(comment);
      return comment;
    },
    onSuccess: () => {
      invalidateComments();
    },
  });

  const resolveThread = useMutation({
    mutationFn: async (threadId: string) => {
      await resolveThreadApi(threadId);
      return threadId;
    },
    onMutate: async threadId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentsKeys.forNote(noteId) });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<CommentData[]>(
        commentsKeys.forNote(noteId),
      );

      // Optimistically update
      queryClient.setQueryData<CommentData[]>(commentsKeys.forNote(noteId), old =>
        old?.map(c => (c.threadId === threadId ? { ...c, resolved: true } : c)),
      );

      return { previousComments };
    },
    onError: (_err, _threadId, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKeys.forNote(noteId), context.previousComments);
      }
    },
    onSettled: () => {
      invalidateComments();
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      await deleteCommentApi(commentId);
      return commentId;
    },
    onMutate: async commentId => {
      await queryClient.cancelQueries({ queryKey: commentsKeys.forNote(noteId) });

      const previousComments = queryClient.getQueryData<CommentData[]>(
        commentsKeys.forNote(noteId),
      );

      // Optimistically remove the comment
      queryClient.setQueryData<CommentData[]>(commentsKeys.forNote(noteId), old =>
        old?.filter(c => c.id !== commentId),
      );

      return { previousComments };
    },
    onError: (_err, _commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(commentsKeys.forNote(noteId), context.previousComments);
      }
    },
    onSettled: () => {
      invalidateComments();
    },
  });

  return {
    createComment,
    resolveThread,
    deleteComment,
  };
}

