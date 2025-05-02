"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/app/types";
import CommentPopover from "../CommentPopover";
import CommentBubble from "../CommentBubble";
import ApiService from "../../utils/api_service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User } from "../../models/user_class"; // assuming you have this

type CommentSidebarProps = {
  noteId: string;
};

export default function CommentSidebar({ noteId }: CommentSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      if (noteId) {
        const fetchedComments = await ApiService.fetchCommentsForNote(noteId);
        setComments(fetchedComments);
      }
    };
    fetchComments();
  }, [noteId]);

  useEffect(() => {
    const checkRole = async () => {
      const roles = await User.getInstance().getRoles();
      setIsInstructor(!!roles?.instructor && !roles?.administrator);
    };
    checkRole();
  }, []);

  const handleSubmitComment = async (text: string) => {
    const currentUser = User.getInstance();
    const authorId = await currentUser.getId();
    const authorName = await currentUser.getName();

    const newComment: Comment = {
      id: "", // will be set by Rerum
      noteId,
      text,
      authorId: authorId || "",
      authorName: authorName || "",
      createdAt: new Date(),
    };

    await ApiService.createComment(newComment);
    setComments((prev) => [...prev, newComment]);
    setShowPopover(false);
  };

  return (
    <div className="bg-white w-80 p-4 border-l h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4">Comments</h2>

      <ScrollArea className="flex-1 space-y-4">
        {comments.length === 0 && (
          <p className="text-gray-400">No comments yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id || Math.random()} className="border p-3 rounded">
            <p className="font-semibold">{comment.authorName}</p>
            <p className="text-sm text-gray-700">{comment.text}</p>
            <p className="text-xs text-gray-400">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </ScrollArea>

      {isInstructor && (
        <div className="mt-4">
          {showPopover ? (
            <CommentPopover
              onSubmit={handleSubmitComment}
              onClose={() => setShowPopover(false)}
            />
          ) : (
            <Button onClick={() => setShowPopover(true)} className="w-full">
              Add Comment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
