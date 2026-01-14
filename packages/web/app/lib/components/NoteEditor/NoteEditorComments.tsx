"use client";

import React, { RefObject } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, X } from "lucide-react";
import { ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CommentSidebar from "../comments/CommentSidebar";
import type { RichTextEditorRef } from "mui-tiptap";

interface NoteEditorCommentsProps {
  noteId: string;
  isCommentSidebarOpen: boolean;
  setIsCommentSidebarOpen: (open: boolean) => void;
  canComment: boolean;
  isViewingStudentNote: boolean;
  isStudentViewingOwnNote: boolean;
  isAnyPopupOpen: boolean;
  rteRef: RefObject<RichTextEditorRef | null>;
}

export function CommentSidebarPanel({
  noteId,
  rteRef,
}: {
  noteId: string;
  rteRef: RefObject<RichTextEditorRef | null>;
}) {
  const getCurrentSelection = () => {
    const editor = rteRef.current?.editor;
    if (!editor) return null;
    const { from, to } = editor.state.selection;
    if (from === to) return null;
    return { from, to };
  };

  return (
    <>
      <ResizableHandle withHandle className="bg-gray-200 hover:bg-gray-300 cursor-col-resize w-[6px]" />
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        maxSize={40}
        className="md:border-l min-w-[280px] md:min-w-[300px] lg:min-w-[340px] transition-[flex-basis] duration-200 ease-out"
      >
        <CommentSidebar noteId={noteId} getCurrentSelection={getCurrentSelection} />
      </ResizablePanel>
    </>
  );
}

export function CommentToggleButton({
  noteId,
  isCommentSidebarOpen,
  setIsCommentSidebarOpen,
  canComment,
  isViewingStudentNote,
  isStudentViewingOwnNote,
  isAnyPopupOpen,
}: NoteEditorCommentsProps) {
  const shouldShow =
    typeof window !== "undefined" &&
    !!noteId &&
    canComment &&
    (isViewingStudentNote || isStudentViewingOwnNote) &&
    !isAnyPopupOpen;

  if (!shouldShow) {
    return null;
  }

  return createPortal(
    <button
      onClick={() => setIsCommentSidebarOpen(!isCommentSidebarOpen)}
      className="fixed top-20 right-4 z-[9999] bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
      aria-label={isCommentSidebarOpen ? "Close comments" : "Open comments"}
    >
      {isCommentSidebarOpen ? (
        <>
          <X className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Close</span>
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Comments</span>
        </>
      )}
    </button>,
    document.body
  );
}

export default function NoteEditorComments(props: NoteEditorCommentsProps) {
  return <CommentToggleButton {...props} />;
}
