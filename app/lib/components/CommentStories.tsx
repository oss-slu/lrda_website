"use client";

import React, { useState } from "react";
import ApiService from "../utils/api_service"; // (optional) for saving comments to rerum

interface CommentStoriesProps {
  noteId: string;
}

const CommentStories: React.FC<CommentStoriesProps> = ({ noteId }) => {
  const [comment, setComment] = useState<string>("");
  const [submittedComment, setSubmittedComment] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    const commentData = {
      type: "noteComment",
      about: noteId,
      comment,
      time: new Date(),
    };

    try {
      // Save the comment into rerum
      await fetch(`${process.env.NEXT_PUBLIC_RERUM_PREFIX}create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      setSubmittedComment(comment);
      setComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
      alert("Failed to save comment.");
    }
  };

  return (
    <div className="mt-4">
      <textarea
        placeholder="Leave a comment about this note..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border p-2 rounded-md mb-2"
        rows={3}
      />

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Submit Comment
        </button>
      </div>

      {submittedComment && (
        <div className="mt-4 p-2 border rounded-md bg-gray-50">
          <p className="text-sm text-gray-700">You commented:</p>
          <p className="text-base">{submittedComment}</p>
        </div>
      )}
    </div>
  );
};

export default CommentStories;
