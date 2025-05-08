"use client";

import { useState, useEffect } from "react";
import type { Key, ReactNode } from "react";
import { Comment } from "@/app/types";
import CommentPopover from "../CommentPopover";
import ApiService from "../../utils/api_service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { User } from "../../models/user_class";
import { v4 as uuidv4 } from "uuid";

interface CommentSidebarProps {
  noteId: string;
}

export default function CommentSidebar({ noteId }: CommentSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);

  // Load existing comments whenever noteId changes
  useEffect(() => {
    if (!noteId) return;
    ApiService.fetchCommentsForNote(noteId).then(setComments);
  }, [noteId]);

  // Determine whether current user is an instructor
  useEffect(() => {
    User.getInstance().getRoles().then((roles) => {
      setIsInstructor(!!roles?.administrator);
    });
  }, []);

  // Handler when instructor submits a new comment
  const handleSubmitComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userApi = User.getInstance();
    const authorId = (await userApi.getId()) ?? "";
    const authorName = (await userApi.getName()) ?? "";

    const newComment: Comment = {
      id: uuidv4() as Key,
      noteId,
      uid: authorId,
      text: trimmed,
      author: authorName,
      authorId,
      authorName: authorName as ReactNode,
      role: isInstructor ? "instructor" : "student",
      createdAt: new Date().toISOString(),
    };

    await ApiService.createComment(newComment);
    setComments((prev) => [...prev, newComment]);
    setShowPopover(false);
  };

  return (
    <div className="bg-white w-80 p-4 border-l h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4">Comments</h2>

      <ScrollArea className="flex-1 space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-400">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id ?? Math.random()} className="border p-3 rounded">
              <p className="font-semibold">{c.authorName}</p>
              <p className="text-sm text-gray-700">{c.text}</p>
              <p className="text-xs text-gray-400">
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
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
