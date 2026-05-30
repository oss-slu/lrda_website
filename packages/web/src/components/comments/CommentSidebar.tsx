import { useState } from 'react';
import { Comment } from '@/types';
import CommentPopover from '../CommentPopover';
import { fetchCreatorName } from '../../services';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { v4 as uuidv4 } from 'uuid';
import { useComments, useCommentMutations } from '../../hooks/queries/useComments';
import { CommentThreadList } from './CommentThreadList';

interface CommentSidebarProps {
  noteId: string;
  isInstructor: boolean;
  canComment: boolean;
  getCurrentSelection?: () => { from: number; to: number } | null;
}

export default function CommentSidebar({
  noteId,
  isInstructor,
  canComment,
  getCurrentSelection,
}: CommentSidebarProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<string>('');

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  // TanStack Query for comments with automatic polling
  const { data: comments = [] } = useComments(noteId);
  const { createComment, resolveThread, deleteComment } = useCommentMutations(noteId);

  // Helper to resolve author display name
  const resolveAuthorName = async (authorId: string, fallback: string): Promise<string> => {
    try {
      if (authorId) {
        const resolved = await fetchCreatorName(authorId);
        if (resolved && resolved !== 'Unknown User') return resolved;
      }
    } catch {}
    return fallback;
  };

  // Handler when user submits a new comment
  const handleSubmitComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const selection = getCurrentSelection ? getCurrentSelection() : null;
    const authorId = authUser?.id ?? '';
    const fallbackAuthor = authUser?.name ?? '';
    const authorDisplay = await resolveAuthorName(authorId, fallbackAuthor);

    const threadId = uuidv4();
    const newComment: Comment = {
      id: uuidv4(),
      noteId,
      text: trimmed,
      authorId,
      authorName: authorDisplay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position: selection,
      threadId,
      parentId: null,
      resolved: false,
    };

    await createComment.mutateAsync(newComment);
    setCommentDraft('');
    setShowPopover(false);

    // Notify editor to refresh highlights
    try {
      window.dispatchEvent(
        new CustomEvent('note:comment-added', {
          detail: { noteId, position: newComment.position },
        }),
      );
    } catch {}
  };

  const handleReply = async (threadId: string, rootCommentId: string) => {
    const trimmed = (replyDrafts[threadId] || '').trim();
    if (!trimmed) return;

    const authorId = authUser?.id ?? '';
    const fallbackAuthor = authUser?.name ?? '';
    const authorDisplay = await resolveAuthorName(authorId, fallbackAuthor);

    const reply: Comment = {
      id: uuidv4(),
      noteId,
      text: trimmed,
      authorId,
      authorName: authorDisplay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position: null,
      threadId,
      parentId: rootCommentId,
      resolved: false,
    };

    await createComment.mutateAsync(reply);
    setReplyDrafts(d => ({ ...d, [threadId]: '' }));
  };

  const handleResolveThread = async (threadId: string) => {
    await resolveThread.mutateAsync(threadId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId) return;
    await deleteComment.mutateAsync(commentId);
  };

  return (
    <div className='flex h-full w-full flex-col overflow-hidden border-t bg-white p-2.5 sm:p-3 md:w-80 md:border-t-0 md:border-l'>
      <h2 className='mb-2.5 shrink-0 text-sm font-semibold sm:mb-3 sm:text-base'>Comments</h2>

      <ScrollArea className='min-h-0 flex-1 overflow-y-auto pr-1'>
        <CommentThreadList
          comments={comments}
          isInstructor={isInstructor}
          canComment={canComment}
          replyDrafts={replyDrafts}
          onReplyDraftChange={(tid, val) => setReplyDrafts(d => ({ ...d, [tid]: val }))}
          onReply={handleReply}
          onResolveThread={handleResolveThread}
          onDeleteComment={handleDeleteComment}
        />
      </ScrollArea>

      {canComment && (
        <div className='mt-auto border-t bg-white pt-2 pb-2'>
          {showPopover ?
            <CommentPopover
              initialValue={commentDraft}
              onSubmit={handleSubmitComment}
              onClose={() => setShowPopover(false)}
              onTextChange={setCommentDraft}
            />
          : <Button onClick={() => setShowPopover(true)} className='h-9 w-full text-xs sm:text-sm'>
              Add Comment
            </Button>
          }
        </div>
      )}
    </div>
  );
}
