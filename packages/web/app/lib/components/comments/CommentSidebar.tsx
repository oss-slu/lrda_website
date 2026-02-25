'use client';

import { useState, useEffect } from 'react';
import type { Key } from 'react';
import { Comment } from '@/app/types';
import CommentPopover from '../CommentPopover';
import { fetchUserById, fetchCreatorName } from '../../services';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { v4 as uuidv4 } from 'uuid';
import { useComments, useCommentMutations } from '../../hooks/queries/useComments';
import { CommentThreadList } from './CommentThreadList';

interface CommentSidebarProps {
  noteId: string;
  getCurrentSelection?: () => { from: number; to: number } | null;
}

export default function CommentSidebar({ noteId, getCurrentSelection }: CommentSidebarProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<string>('');

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  // TanStack Query for comments with automatic polling
  const { data: comments = [], refetch } = useComments(noteId);
  const { createComment, resolveThread, deleteComment } = useCommentMutations(noteId);

  // Determine whether current user is an instructor or a student
  useEffect(() => {
    const checkInstructor = async () => {
      const uid = authUser?.uid;
      if (!uid) return;

      const roles = authUser?.roles;

      // Fetch userData to check isInstructor flag
      let userData = null;
      try {
        userData = await fetchUserById(uid);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // Check if user is an instructor (has administrator role OR isInstructor flag in userData)
      const flag = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructor(flag);

      // Check if user is a student (has contributor role but not administrator)
      const isStudentRole = !!roles?.contributor && !roles?.administrator;

      // For students, verify they have a parentInstructorId
      let isStudentInTeacherStudentModel = false;
      if (isStudentRole && userData) {
        isStudentInTeacherStudentModel = !!userData?.parentInstructorId;
      }

      // Allow commenting for administrators, instructors, or students in teacher-student relationship
      setCanComment(
        !!uid &&
          (!!roles?.administrator || !!userData?.isInstructor || isStudentInTeacherStudentModel),
      );
    };
    checkInstructor();
  }, [authUser]);

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
    const authorId = authUser?.uid ?? '';
    const fallbackAuthor = authUser?.name ?? '';
    const authorDisplay = await resolveAuthorName(authorId, fallbackAuthor);

    const threadId = uuidv4();
    const newComment: Comment = {
      id: uuidv4(),
      noteId,
      uid: authorId,
      text: trimmed,
      author: authorDisplay,
      authorId,
      authorName: authorDisplay,
      role: isInstructor ? 'instructor' : 'student',
      createdAt: new Date().toISOString(),
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('note:comment-added', {
            detail: { noteId, position: newComment.position },
          }),
        );
      }
    } catch {}
  };

  const handleReply = async (threadId: string) => {
    const trimmed = (replyDrafts[threadId] || '').trim();
    if (!trimmed) return;

    const authorId = authUser?.uid ?? '';
    const fallbackAuthor = authUser?.name ?? '';
    const authorDisplay = await resolveAuthorName(authorId, fallbackAuthor);

    const reply: Comment = {
      id: uuidv4(),
      noteId,
      uid: authorId,
      text: trimmed,
      author: authorDisplay,
      authorId,
      authorName: authorDisplay,
      role: isInstructor ? 'instructor' : 'student',
      createdAt: new Date().toISOString(),
      position: null,
      threadId,
      parentId: String(threadId),
      resolved: false,
    };

    await createComment.mutateAsync(reply);
    setReplyDrafts(d => ({ ...d, [threadId]: '' }));
  };

  const handleResolveThread = async (threadId: string) => {
    await resolveThread.mutateAsync(threadId);
  };

  const handleDeleteComment = async (commentId?: Key | null | undefined) => {
    const id = String(commentId || '');
    if (!id) return;
    await deleteComment.mutateAsync(id);
  };

  return (
    <div className='flex h-full w-full flex-col overflow-hidden border-t bg-white p-2.5 sm:p-3 md:w-80 md:border-l md:border-t-0'>
      <h2 className='mb-2.5 flex-shrink-0 text-sm font-semibold sm:mb-3 sm:text-base'>Comments</h2>

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
        <div className='mt-auto border-t bg-white pb-2 pt-2'>
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
