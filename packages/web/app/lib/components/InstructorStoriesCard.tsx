'use client';

import React, { useEffect, useState } from 'react';
import { Note, Comment } from '@/app/types';
import ApiService from '../utils/api_service';
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
  const [comments, setComments] = useState<Comment[]>(note.comments || []);
  const [loading, setLoading] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [sanitizedBodyHtml, setSanitizedBodyHtml] = useState<string>('');

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  // Determine real ID and body text fields
  const noteId = (note as any).id || (note as any)._id || (note as any)['@id'] || '';
  const bodyHtml = (note as any).BodyText || note.text || '';

  // Sanitize HTML content
  useEffect(() => {
    if (bodyHtml) {
      setSanitizedBodyHtml(sanitizeHtml(bodyHtml, { allowVideo: true, allowAudio: true }));
    }
  }, [bodyHtml]);

  // Debug logs
  useEffect(() => {
    console.log('🃏 [EnhancedNoteCard] noteId:', noteId);
    console.log('🃏 [EnhancedNoteCard] bodyHtml:', bodyHtml);
  }, [noteId, bodyHtml]);

  // Set user roles from auth store
  useEffect(() => {
    const roles = authUser?.roles;
    setIsStudent(!!roles?.contributor && !roles?.administrator);
    setIsInstructor(!!roles?.administrator);
  }, [authUser]);

  // Fetch creator name and location
  useEffect(() => {
    ApiService.fetchCreatorName(note.creator)
      .then(setCreatorName)
      .catch(() => setCreatorName('Unknown'));

    const fetchLocation = async () => {
      const MAPS_API_KEY = process.env.NEXT_PUBLIC_MAP_KEY;
      if (note.latitude && note.longitude && MAPS_API_KEY) {
        const lat = parseFloat(note.latitude.toString());
        const lng = parseFloat(note.longitude.toString());

        // Use the shared location cache utility
        const location = await getCachedLocation(lat, lng, MAPS_API_KEY);
        setLocation(location || 'Unknown Location');
      } else {
        setLocation(note.latitude && note.longitude ? 'Unknown Location' : '');
      }
    };

    fetchLocation();
  }, [note.creator, note.latitude, note.longitude]);

  // Comment submission
  const handleSubmitComment = async () => {
    if (!commentText.trim()) return toast.error('Comment cannot be empty');

    setLoading(true);
    try {
      const userId = authUser?.uid;
      const userName = authUser?.name ?? '';

      const newComment: Comment = {
        id: uuidv4(),
        text: commentText.trim(),
        author: userName,
        authorId: userId || '',
        role: isStudent ? 'student' : 'instructor',
        createdAt: new Date().toISOString(),
        authorName: undefined,
        noteId: '',
        uid: '',
      };

      const updatedComments = [...comments, newComment];
      const updatedNote: Note = {
        ...note,
        id: noteId,
        comments: updatedComments,
      };

      const response = await ApiService.overwriteNote(updatedNote);
      if (!response.ok) throw new Error('Failed to save comment');

      setComments(updatedComments);
      setCommentText('');
      toast.success('Comment added!');
    } catch (err) {
      console.error('Comment submission failed:', err);
      toast.error('Failed to submit comment.');
    } finally {
      setLoading(false);
    }
  };

  // Approve (publish): shown to any non‐student when approvalRequested && not yet published
  const handleApprove = async () => {
    setLoading(true);
    try {
      await ApiService.overwriteNote({
        ...note,
        id: noteId,
        published: true,
        approvalRequested: false,
      });
      toast.success('Note approved and published!');
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve note.');
    } finally {
      setLoading(false);
    }
  };

  // HTML preview
  const previewText = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.innerText.slice(0, 100) + '...';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className='max-w-sm cursor-pointer rounded-lg border bg-white shadow-md transition hover:shadow-lg'>
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

            {/* ← Here we render the actual HTML snippet, limited in height */}
            <div
              className='max-h-[80px] overflow-hidden text-sm text-gray-700'
              dangerouslySetInnerHTML={{ __html: sanitizedBodyHtml }}
            />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className='max-h-[90vh] max-w-[90%] overflow-y-auto'>
        <DialogTitle className='mb-4 text-2xl font-bold'>{note.title}</DialogTitle>

        {/* show Approve to any non‑student when approvalRequested && not published */}
        {!isStudent && note.approvalRequested && !note.published && (
          <div className='mb-4 flex justify-end'>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? 'Approving…' : 'Approve'}
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
          <div className='mb-4 space-y-4'>
            {comments.length ?
              comments.map(c => (
                <div key={c.id} className='rounded border bg-gray-100 p-2'>
                  <div className='font-semibold'>{c.author}</div>
                  <div>{c.text}</div>
                  <div className='text-xs text-gray-500'>
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            : <p className='text-gray-500'>No comments yet.</p>}
          </div>

          <div className='space-y-2'>
            <Textarea
              placeholder='Leave feedback…'
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              disabled={loading}
              rows={3}
            />
            <Button onClick={handleSubmitComment} disabled={loading || !commentText.trim()}>
              {loading ? 'Submitting…' : 'Submit Comment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstructorEnhancedNoteCard;
