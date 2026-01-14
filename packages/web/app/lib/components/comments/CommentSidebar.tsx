"use client";

import { useState, useEffect } from "react";
import type { Key, ReactNode } from "react";
import { Comment } from "@/app/types";
import CommentPopover from "../CommentPopover";
import ApiService from "../../utils/api_service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../stores/authStore";
import { useShallow } from "zustand/react/shallow";
import { v4 as uuidv4 } from "uuid";
import { useComments, useCommentMutations } from "../../hooks/queries/useComments";

interface CommentSidebarProps {
  noteId: string;
  getCurrentSelection?: () => { from: number; to: number } | null;
}

export default function CommentSidebar({ noteId, getCurrentSelection }: CommentSidebarProps) {
  const [showPopover, setShowPopover] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<string>("");

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
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
        userData = await ApiService.fetchUserData(uid);
      } catch (error) {
        console.error("Error fetching user data:", error);
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
      setCanComment(!!uid && (!!roles?.administrator || !!userData?.isInstructor || isStudentInTeacherStudentModel));
    };
    checkInstructor();
  }, [authUser]);

  // Helper to resolve author display name
  const resolveAuthorName = async (authorId: string, fallback: string): Promise<string> => {
    try {
      if (authorId) {
        const resolved = await ApiService.fetchCreatorName(authorId);
        if (resolved && resolved !== "Unknown User") return resolved;
      }
    } catch {}
    return fallback;
  };

  // Handler when user submits a new comment
  const handleSubmitComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const selection = getCurrentSelection ? getCurrentSelection() : null;
    const authorId = authUser?.uid ?? "";
    const fallbackAuthor = authUser?.name ?? "";
    const authorDisplay = await resolveAuthorName(authorId, fallbackAuthor);

    const threadId = uuidv4();
    const newComment: Comment = {
      id: uuidv4() as Key,
      noteId,
      uid: authorId,
      text: trimmed,
      author: authorDisplay,
      authorId,
      authorName: authorDisplay as ReactNode,
      role: isInstructor ? "instructor" : "student",
      createdAt: new Date().toISOString(),
      position: selection,
      threadId,
      parentId: null,
      resolved: false,
    };

    await createComment.mutateAsync(newComment);
    setCommentDraft("");
    setShowPopover(false);

    // Notify editor to refresh highlights
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("note:comment-added", {
            detail: { noteId, position: newComment.position },
          })
        );
      }
    } catch {}
  };

  const handleReply = async (threadId: string) => {
    const trimmed = (replyDrafts[threadId] || "").trim();
    if (!trimmed) return;

    const authorId = authUser?.uid ?? "";
    const fallbackAuthor = authUser?.name ?? "";
    const authorDisplay = await resolveAuthorName(authorId, fallbackAuthor);

    const reply: Comment = {
      id: uuidv4() as Key,
      noteId,
      uid: authorId,
      text: trimmed,
      author: authorDisplay,
      authorId,
      authorName: authorDisplay as ReactNode,
      role: isInstructor ? "instructor" : "student",
      createdAt: new Date().toISOString(),
      position: null,
      threadId,
      parentId: String(threadId),
      resolved: false,
    };

    await createComment.mutateAsync(reply);
    setReplyDrafts((d) => ({ ...d, [threadId]: "" }));
  };

  const handleResolveThread = async (threadId: string) => {
    await resolveThread.mutateAsync(threadId);
  };

  const handleDeleteComment = async (commentId?: Key | null | undefined) => {
    const id = String(commentId || "");
    if (!id) return;
    await deleteComment.mutateAsync(id);
  };

  // Group comments by thread
  const threads = comments
    .filter((c) => !c.parentId)
    .map((root) => {
      const tid = String(root.threadId || root.id);
      return {
        root: { ...root, threadId: tid },
        replies: comments.filter((r) => String(r.parentId) === tid),
      };
    });

  return (
    <div className="bg-white w-full md:w-80 p-2.5 sm:p-3 border-t md:border-t-0 md:border-l h-full flex flex-col overflow-hidden">
      <h2 className="text-sm sm:text-base font-semibold mb-2.5 sm:mb-3 flex-shrink-0">Comments</h2>

      <ScrollArea className="flex-1 min-h-0 space-y-2.5 sm:space-y-3 pr-1 overflow-y-auto">
        {threads.length === 0 ? (
          <p className="text-gray-400">No comments yet.</p>
        ) : (
          threads.map(({ root, replies }) => (
            <div key={String(root.id)} className="border border-gray-200 bg-gray-50 p-2 sm:p-2.5 rounded-md space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] sm:text-sm truncate">
                    {root.authorName}
                    {root.resolved && <span className="ml-2 text-xs text-green-600">(Resolved)</span>}
                  </p>
                  <p className="text-[12px] sm:text-xs text-gray-700 whitespace-pre-wrap break-words">{root.text}</p>
                  <p className="text-[10px] sm:text-[11px] text-gray-400">{new Date(root.createdAt).toLocaleString()}</p>
                </div>
                {isInstructor && (
                  <div className="flex gap-1.5 ml-2 shrink-0">
                    {!root.resolved && (
                      <Button
                        size="sm"
                        className="h-7 px-2 text-xs"
                        variant="secondary"
                        onClick={() => handleResolveThread(String(root.threadId))}
                      >
                        Resolve
                      </Button>
                    )}
                    <Button size="sm" className="h-7 px-2 text-xs" variant="ghost" onClick={() => handleDeleteComment(root.id)}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>

              {replies.length > 0 && (
                <div className="ml-2 sm:ml-3 border-l pl-2 sm:pl-3 space-y-1.5">
                  {replies.map((r) => (
                    <div key={String(r.id)} className="">
                      <p className="font-medium text-[12px] sm:text-xs truncate">{r.authorName}</p>
                      <p className="text-[12px] sm:text-xs text-gray-700 whitespace-pre-wrap break-words">{r.text}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] sm:text-[11px] text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                        {isInstructor && (
                          <Button size="sm" className="h-7 px-2 text-xs" variant="ghost" onClick={() => handleDeleteComment(r.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {canComment && !root.resolved && (
                <div className="mt-1.5 flex gap-1.5">
                  <input
                    className="flex-1 border rounded px-2 py-1 text-[12px] sm:text-xs"
                    placeholder="Reply..."
                    value={replyDrafts[String(root.threadId || root.id)] || ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [String(root.threadId || root.id)]: e.target.value }))}
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleReply(String(root.threadId || root.id))}>
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </ScrollArea>

      {canComment && (
        <div className="mt-auto pt-2 pb-2 bg-white border-t">
          {showPopover ? (
            <CommentPopover
              initialValue={commentDraft}
              onSubmit={handleSubmitComment}
              onClose={() => setShowPopover(false)}
              onTextChange={setCommentDraft}
            />
          ) : (
            <Button onClick={() => setShowPopover(true)} className="w-full h-9 text-xs sm:text-sm">
              Add Comment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
