"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Key, ReactNode } from "react";
import { Comment } from "@/app/types";
import CommentPopover from "../CommentPopover";
import ApiService from "../../utils/api_service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../stores/authStore";
import { useShallow } from "zustand/react/shallow";
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
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingPausedRef = useRef<boolean>(false);

  // Use auth store for user data
  const { user: authUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  // Function to load comments - memoized with useCallback
  const loadComments = useCallback(async () => {
    if (!noteId) {
      console.log("CommentSidebar: No noteId provided");
      return;
    }
    console.log("CommentSidebar: Loading comments for noteId:", noteId);
    try {
      const raw = await ApiService.fetchCommentsForNote(noteId);
      console.log("CommentSidebar: Raw comments fetched:", raw.length, raw);
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
      console.log("CommentSidebar: Enriched comments:", enriched.length, enriched);
      setComments(enriched as any);
    } catch (error) {
      console.error("CommentSidebar: Error loading comments:", error);
      setComments([]);
    }
  }, [noteId]);

  // Load existing comments whenever noteId changes and normalize author names
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Polling effect: automatically refresh comments every 15 seconds
  useEffect(() => {
    if (!noteId) return;

    const POLLING_INTERVAL = 15000; // 15 seconds

    // Handle visibility change to pause/resume polling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPollingPausedRef.current = true;
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        isPollingPausedRef.current = false;
        // Restart polling when page becomes visible
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        pollingIntervalRef.current = setInterval(() => {
          if (!isPollingPausedRef.current) {
            loadComments();
          }
        }, POLLING_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Start polling
    const startPolling = () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = setInterval(() => {
        if (!isPollingPausedRef.current) {
          loadComments();
        }
      }, POLLING_INTERVAL);
    };

    startPolling();

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [loadComments]);

  // Determine whether current user is an instructor or a student (part of teacher-student relationship only)
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
      // Allow commenting for administrators even if isInstructor flag isn't set
      const flag = !!roles?.administrator || !!userData?.isInstructor;
      setIsInstructor(flag);

      // Check if user is a student (has contributor role but not administrator)
      const isStudentRole = !!roles?.contributor && !roles?.administrator;

      // For students, verify they have a parentInstructorId (part of teacher-student relationship)
      let isStudentInTeacherStudentModel = false;
      if (isStudentRole && userData) {
        // Student must have parentInstructorId to be part of teacher-student model
        isStudentInTeacherStudentModel = !!userData?.parentInstructorId;
      }

      // Allow commenting for:
      // 1. Administrators (roles?.administrator)
      // 2. Instructors (userData?.isInstructor)
      // 3. Students who are part of teacher-student relationship (have parentInstructorId)
      setCanComment(!!uid && (!!roles?.administrator || !!userData?.isInstructor || isStudentInTeacherStudentModel));
    };
    checkInstructor();
  }, [authUser]);

  // Handler when instructor submits a new comment
  const handleSubmitComment = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Selection is optional; allow generic comments
    const selection = getCurrentSelection ? getCurrentSelection() : null;

    const authorId = authUser?.uid ?? "";
    const fallbackAuthor = authUser?.name ?? "";
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
    // Reload comments from API to ensure we have the latest data
    try {
      const reloaded = await ApiService.fetchCommentsForNote(noteId);
      const enriched = await Promise.all(
        reloaded.map(async (c) => {
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
    } catch (error) {
      console.error("Error reloading comments after creation:", error);
      // Fallback to adding locally
      setComments((prev) => [...prev, newComment]);
    }
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
    const authorId = authUser?.uid ?? "";
    const fallbackAuthor = authUser?.name ?? "";
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
    // Reload comments from API to ensure we have the latest data
    try {
      const reloaded = await ApiService.fetchCommentsForNote(noteId);
      const enriched = await Promise.all(
        reloaded.map(async (c) => {
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
    } catch (error) {
      console.error("Error reloading comments after reply:", error);
      // Fallback to adding locally
      setComments((prev) => [...prev, reply]);
    }
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
