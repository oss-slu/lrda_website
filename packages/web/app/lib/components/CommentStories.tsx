'use client';

import React, { useState } from 'react';
import { commentsService } from '@/app/lib/services';
import { useAuthStore } from '@/app/lib/stores/authStore';

interface CommentStoriesProps {
  noteId: string;
}

const CommentStories: React.FC<CommentStoriesProps> = ({ noteId }) => {
  const [comment, setComment] = useState<string>('');
  const [submittedComment, setSubmittedComment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useAuthStore(state => state.user);

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    if (!user) {
      alert('You must be logged in to comment.');
      return;
    }

    setIsSubmitting(true);

    try {
      await commentsService.create({
        noteId,
        text: comment,
        authorId: user.uid,
        authorName: user.name,
        createdAt: new Date().toISOString(),
      });

      setSubmittedComment(comment);
      setComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to save comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='mt-4'>
      <textarea
        placeholder='Leave a comment about this note...'
        value={comment}
        onChange={e => setComment(e.target.value)}
        className='mb-2 w-full rounded-md border p-2'
        rows={3}
        disabled={isSubmitting}
      />

      <div className='flex gap-2'>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !comment.trim()}
          className='rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-400'
        >
          {isSubmitting ? 'Submitting...' : 'Submit Comment'}
        </button>
      </div>

      {submittedComment && (
        <div className='mt-4 rounded-md border bg-gray-50 p-2'>
          <p className='text-sm text-gray-700'>You commented:</p>
          <p className='text-base'>{submittedComment}</p>
        </div>
      )}
    </div>
  );
};

export default CommentStories;
