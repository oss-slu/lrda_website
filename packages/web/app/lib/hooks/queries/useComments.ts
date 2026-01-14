import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Comment } from '@/app/types';
import ApiService from '../../utils/api_service';

// Query key factory for comments
export const commentsKeys = {
  all: ['comments'] as const,
  forNote: (noteId: string) => [...commentsKeys.all, noteId] as const,
};

/**
 * Enriches comments with author display names
 * Resolves proper display names when authorName is missing or contains an email
 */
async function enrichCommentsWithAuthorNames(comments: Comment[]): Promise<Comment[]> {
  return Promise.all(
    comments.map(async comment => {
      const needsName =
        !comment.authorName ||
        (typeof comment.authorName === 'string' && (comment.authorName as string).includes('@'));

      if (needsName && comment.authorId) {
        try {
          const displayName = await ApiService.fetchCreatorName(comment.authorId);
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
 * Hook for fetching comments for a note with automatic polling
 * Polls every 15 seconds when the page is visible
 */
export function useComments(noteId: string | null) {
  return useQuery({
    queryKey: commentsKeys.forNote(noteId ?? ''),
    queryFn: async (): Promise<Comment[]> => {
      if (!noteId) return [];
      const raw = await ApiService.fetchCommentsForNote(noteId);
      return enrichCommentsWithAuthorNames(raw);
    },
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
    mutationFn: async (comment: Comment) => {
      await ApiService.createComment(comment);
      return comment;
    },
    onSuccess: () => {
      invalidateComments();
    },
  });

  const resolveThread = useMutation({
    mutationFn: async (threadId: string) => {
      await ApiService.resolveThread(threadId);
      return threadId;
    },
    onMutate: async threadId => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: commentsKeys.forNote(noteId) });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<Comment[]>(commentsKeys.forNote(noteId));

      // Optimistically update
      queryClient.setQueryData<Comment[]>(commentsKeys.forNote(noteId), old =>
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
      await ApiService.archiveComment(commentId);
      return commentId;
    },
    onMutate: async commentId => {
      await queryClient.cancelQueries({ queryKey: commentsKeys.forNote(noteId) });

      const previousComments = queryClient.getQueryData<Comment[]>(commentsKeys.forNote(noteId));

      // Optimistically remove the comment
      queryClient.setQueryData<Comment[]>(commentsKeys.forNote(noteId), old =>
        old?.filter(c => String(c.id) !== commentId),
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
