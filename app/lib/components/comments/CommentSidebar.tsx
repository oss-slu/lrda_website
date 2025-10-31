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
  getCurrentSelection?: () => { from: number; to: number } | null;
}

export default function CommentSidebar({ noteId, getCurrentSelection }: CommentSidebarProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [canComment, setCanComment] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [commentDraft, setCommentDraft] = useState<string>(""); // Preserve draft comment text

  // Load existing comments whenever noteId changes and normalize author names
  useEffect(() => {
    const load = async () => {
      if (!noteId) return;
      const raw = await ApiService.fetchCommentsForNote(noteId);
      // Resolve proper display names when needed
      const enriched = await Promise.all(
        raw.map(async (c) => {
          const needsName = !c.authorName || (typeof c.authorName === "string" && (c.authorName as string).includes("@"));
          if (needsName && c.authorId) {
            try {
              const display = await ApiService.fetchCreatorName(c.authorId);
              return { ...c, authorName: display } as any;
            } catch {
              return c as any;
            }
          }
          return c as any;
        })
      );
      setComments(enriched as any);
    };
    load();
  }, [noteId]);

  // Determine whether current user is an instructor or a student (part of teacher-student relationship only)
  useEffect(() => {
    const checkInstructor = async () => {
      const flag = await User.getInstance().isInstructor();
      setIsInstructor(!!flag);
      const uid = await User.getInstance().getId();
      const roles = await User.getInstance().getRoles();
      
      // Check if user is a student (has contributor role but not administrator)
      const isStudentRole = !!roles?.contributor && !roles?.administrator;
      
      // For students, verify they have a parentInstructorId (part of teacher-student relationship)
      let isStudentInTeacherStudentModel = false;
      if (isStudentRole && uid) {
        try {
          const userData = await ApiService.fetchUserData(uid);
          // Student must have parentInstructorId to be part of teacher-student model
          isStudentInTeacherStudentModel = !!userData?.parentInstructorId;
        } catch (error) {
          console.error("Error checking student relationship:", error);
        }
      }
      
      // Allow commenting only for:
      // 1. Instructors (isInstructor = true)
      // 2. Students who are part of teacher-student relationship (have parentInstructorId)
      // Exclude independent contributors (administrator=true) even if they have contributor=true
      setCanComment(!!uid && (flag || isStudentInTeacherStudentModel));
    };
    checkInstructor();
  }, []);

  // Handler when instructor submits a new comment
  const handleSubmitComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Selection is optional; allow generic comments
    const selection = getCurrentSelection ? getCurrentSelection() : null;

    const userApi = User.getInstance();
    const authorId = (await userApi.getId()) ?? "";
    const fallbackAuthor = (await userApi.getName()) ?? "";
    let authorDisplay = fallbackAuthor;
    try {
      if (authorId) {
        const resolved = await ApiService.fetchCreatorName(authorId);
        if (resolved && resolved !== "Unknown User") authorDisplay = resolved;
      }
    } catch {}

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

    await ApiService.createComment(newComment);
    setComments((prev) => [...prev, newComment]);
    setCommentDraft(""); // Clear draft on successful submit
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
    const userApi = User.getInstance();
    const authorId = (await userApi.getId()) ?? "";
    const fallbackAuthor = (await userApi.getName()) ?? "";
    let authorDisplay = fallbackAuthor;
    try {
      if (authorId) {
        const resolved = await ApiService.fetchCreatorName(authorId);
        if (resolved && resolved !== "Unknown User") authorDisplay = resolved;
      }
    } catch {}

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

    await ApiService.createComment(reply);
    setComments((prev) => [...prev, reply]);
    setReplyDrafts((d) => ({ ...d, [threadId]: "" }));
  };

  const handleResolveThread = async (threadId: string) => {
    try {
      await ApiService.resolveThread(threadId);
      setComments((prev) => prev.map((c) => (c.threadId === threadId ? { ...c, resolved: true } : c)));
    } catch {}
  };

  const handleDeleteComment = async (commentId?: Key | null | undefined) => {
    const id = String(commentId || "");
    if (!id) return;
    try {
      await ApiService.archiveComment(id);
      setComments((prev) => prev.filter((c) => String(c.id) !== id));
    } catch {}
  };

  return (
    <div className="bg-white w-full md:w-80 p-2.5 sm:p-3 border-t md:border-t-0 md:border-l h-full flex flex-col overflow-hidden">
      <h2 className="text-sm sm:text-base font-semibold mb-2.5 sm:mb-3 flex-shrink-0">Comments</h2>

      <ScrollArea className="flex-1 min-h-0 space-y-2.5 sm:space-y-3 pr-1 overflow-y-auto">
        {(() => {
          if (comments.length === 0) return <p className="text-gray-400">No comments yet.</p>;
          // Group by threadId (top-level comments with parentId === null)
          const threads = comments
            .filter((c) => !c.parentId)
            .map((root) => {
              const tid = String(root.threadId || root.id);
              return {
                root: { ...root, threadId: tid },
                replies: comments.filter((r) => String(r.parentId) === tid),
              };
            });

          return threads.map(({ root, replies }) => (
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
                      <Button size="sm" className="h-7 px-2 text-xs" variant="secondary" onClick={() => handleResolveThread(String(root.threadId))}>Resolve</Button>
                    )}
                    <Button size="sm" className="h-7 px-2 text-xs" variant="ghost" onClick={() => handleDeleteComment(root.id)}>Delete</Button>
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
                          <Button size="sm" className="h-7 px-2 text-xs" variant="ghost" onClick={() => handleDeleteComment(r.id)}>Delete</Button>
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
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleReply(String(root.threadId || root.id))}>Reply</Button>
                </div>
              )}
            </div>
          ));
        })()}
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
