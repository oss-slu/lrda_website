'use client';

import React, { useEffect, useState } from 'react';
import { Note } from '@/app/types';
import { fetchCreatorName, notesService } from '../services';
import { getCachedLocation } from '../utils/location_cache';
import { sanitizeHtml } from '../utils/sanitize';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, Clock3, UserCircle, ImageIcon, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../stores/authStore';
import { useShallow } from 'zustand/react/shallow';
import { useComments, useCommentMutations } from '../hooks/queries/useComments';
import { CommentThreadList } from './comments/CommentThreadList';
import { useQueryClient } from '@tanstack/react-query';

// Utility functions
const formatDate = (date: string | number | Date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const formatTime = (date: string | number | Date) => {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h % 12 || 12}:${m} ${ampm}`;
};

const InstructorEnhancedNoteCard: React.FC<{ note: Note }> = ({ note }) => {
  const [creatorName, setCreatorName] = useState('Loading...');
  const [location, setLocation] = useState('Fetching...');
  const [commentText, setCommentText] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const [sanitizedBodyHtml, setSanitizedBodyHtml] = useState<string>('');

  const queryClient = useQueryClient();

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  const noteId = note.id;
  const bodyHtml = note.text || '';

  // Fetch comments from the PostgreSQL comment table
  const { data: comments = [] } = useComments(noteId);
  const { createComment, resolveThread, deleteComment } = useCommentMutations(noteId);

  // Derive role from auth store -- use isInstructor field, not roles.administrator
  const isInstructor = !!authUser?.isInstructor || authUser?.role === 'admin';
  const isStudent = !isInstructor;
  const canComment = !!authUser?.id;

  // Sanitize HTML content
  useEffect(() => {
    if (bodyHtml) {
      setSanitizedBodyHtml(sanitizeHtml(bodyHtml, { allowVideo: true, allowAudio: true }));
    }
  }, [bodyHtml]);

  // Fetch creator name and location
  useEffect(() => {
    fetchCreatorName(note.creator)
      .then(setCreatorName)
      .catch(() => setCreatorName('Unknown'));

    const fetchLocation = async () => {
      const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAP_KEY;
      if (note.latitude && note.longitude && MAPS_API_KEY) {
        const lat = parseFloat(note.latitude.toString());
        const lng = parseFloat(note.longitude.toString());

        const loc = await getCachedLocation(lat, lng, MAPS_API_KEY);
        setLocation(loc || 'Unknown Location');
      } else {
        setLocation(note.latitude && note.longitude ? 'Unknown Location' : '');
      }
    };

    fetchLocation();
  }, [note.creator, note.latitude, note.longitude]);

  // Comment submission via the real comments API
  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return toast.error('Comment cannot be empty');

    try {
      const threadId = uuidv4();
      await createComment.mutateAsync({
        id: uuidv4(),
        noteId,
        text: trimmed,
        authorId: authUser?.id ?? '',
        authorName: authUser?.name ?? '',
        createdAt: new Date().toISOString(),
        position: null,
        threadId,
        parentId: null,
        resolved: false,
      });
      setCommentText('');
      toast.success('Comment added!');
    } catch (err) {
      console.error('Comment submission failed:', err);
      toast.error('Failed to submit comment.');
    }
  };

  const handleReply = async (threadId: string) => {
    const trimmed = (replyDrafts[threadId] || '').trim();
    if (!trimmed) return;

    try {
      await createComment.mutateAsync({
        id: uuidv4(),
        noteId,
        text: trimmed,
        authorId: authUser?.id ?? '',
        authorName: authUser?.name ?? '',
        createdAt: new Date().toISOString(),
        position: null,
        threadId,
        parentId: threadId,
        resolved: false,
      });
      setReplyDrafts(d => ({ ...d, [threadId]: '' }));
    } catch (err) {
      console.error('Reply submission failed:', err);
      toast.error('Failed to submit reply.');
    }
  };

  const invalidateNoteQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['instructor-notes'] });
    queryClient.invalidateQueries({ queryKey: ['student-feedback'] });
  };

  // Approve: publish the note
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await notesService.update({
        ...note,
        id: noteId,
        published: true,
        approvalRequested: false,
      });
      toast.success('Note approved and published!');
      invalidateNoteQueries();
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve note.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject: clear the approval request without publishing
  const handleReject = async () => {
    setActionLoading(true);
    try {
      await notesService.update({
        ...note,
        id: noteId,
        published: false,
        approvalRequested: false,
      });
      toast.success('Approval request declined.');
      invalidateNoteQueries();
    } catch (err) {
      console.error('Rejection failed:', err);
      toast.error('Failed to decline request.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className='max-w-sm cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md'>
          <div className='p-4'>
            <div className='mb-2 text-lg font-bold'>{note.title}</div>
            <div className='mb-2 flex items-center text-sm text-gray-500'>
              <UserCircle size={16} className='mr-1' /> {creatorName}
            </div>
            <div className='mb-2 flex items-center text-sm text-gray-500'>
              <CalendarDays size={16} className='mr-1' /> {formatDate(note.time)}
            </div>
            <div className='mb-2 flex items-center text-sm text-gray-500'>
              <Clock3 size={16} className='mr-1' /> {formatTime(note.time)}
            </div>
            {location && (
              <div className='mb-2 flex items-center text-sm text-gray-500'>
                <ImageIcon size={16} className='mr-1' /> {location}
              </div>
            )}

            <div
              className='max-h-[80px] overflow-hidden text-sm text-gray-700'
              dangerouslySetInnerHTML={{ __html: sanitizedBodyHtml }}
            />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] max-w-[90%] overflow-y-auto'>
        <DialogTitle className='mb-4 text-2xl font-bold'>{note.title}</DialogTitle>

        {/* Approve/Reject buttons for instructors when approval is pending */}
        {isInstructor && note.approvalRequested && !note.published && (
          <div className='mb-4 flex justify-end gap-2'>
            <Button variant='outline' onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Decline'}
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : 'Approve'}
            </Button>
          </div>
        )}

        <ScrollArea className='mb-4 max-h-[300px] border bg-white p-4'>
          <div dangerouslySetInnerHTML={{ __html: sanitizedBodyHtml }} />
        </ScrollArea>

        <div className='border-t pt-4'>
          <h3 className='mb-2 flex items-center gap-2 font-semibold'>
            <MessageSquare size={20} /> Comments
          </h3>

          <CommentThreadList
            comments={comments}
            isInstructor={isInstructor}
            canComment={canComment}
            replyDrafts={replyDrafts}
            onReplyDraftChange={(tid, val) => setReplyDrafts(d => ({ ...d, [tid]: val }))}
            onReply={handleReply}
            onResolveThread={async tid => {
              try {
                await resolveThread.mutateAsync(tid);
              } catch {
                toast.error('Failed to resolve thread.');
              }
            }}
            onDeleteComment={async id => {
              try {
                await deleteComment.mutateAsync(String(id ?? ''));
              } catch {
                toast.error('Failed to delete comment.');
              }
            }}
          />

          {canComment && (
            <div className='mt-4 space-y-2'>
              <Textarea
                placeholder='Leave feedback...'
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || createComment.isPending}
              >
                {createComment.isPending ? 'Submitting...' : 'Submit Comment'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorEnhancedNoteCard;
