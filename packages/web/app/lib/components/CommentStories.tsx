'use client';

import React, { useState } from 'react';

interface CommentStoriesProps {
  noteId: string;
}

const CommentStories: React.FC<CommentStoriesProps> = ({ noteId }) => {
  const [comment, setComment] = useState<string>('');
  const [submittedComment, setSubmittedComment] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    const commentData = {
      type: 'noteComment',
      about: noteId,
      comment,
      time: new Date(),
    };

    try {
      // Save the comment into rerum
      await fetch(`${process.env.NEXT_PUBLIC_RERUM_PREFIX}create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      setSubmittedComment(comment);
      setComment('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to save comment.');
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
      />

      <div className='flex gap-2'>
        <button
          onClick={handleSubmit}
          className='rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
        >
          Submit Comment
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
