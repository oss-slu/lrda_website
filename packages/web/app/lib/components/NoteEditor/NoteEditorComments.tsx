'use client';

import React, { RefObject } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X } from 'lucide-react';
import { ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import CommentSidebar from '../comments/CommentSidebar';
import type { RichTextEditorRef } from 'mui-tiptap';

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
      <ResizableHandle
        withHandle
        className='w-[6px] cursor-col-resize bg-gray-200 hover:bg-gray-300'
      />
      <ResizablePanel
        defaultSize={30}
        minSize={20}
        maxSize={40}
        className='min-w-[280px] transition-[flex-basis] duration-200 ease-out md:min-w-[300px] md:border-l lg:min-w-[340px]'
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
    typeof window !== 'undefined' &&
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
      className='fixed right-4 top-20 z-[9999] flex items-center justify-center gap-2 rounded-full bg-blue-500 p-3 text-white shadow-lg transition-all duration-200 hover:bg-blue-600'
      aria-label={isCommentSidebarOpen ? 'Close comments' : 'Open comments'}
    >
      {isCommentSidebarOpen ?
        <>
          <X className='h-4 w-4' />
          <span className='hidden text-sm sm:inline'>Close</span>
        </>
      : <>
          <MessageSquare className='h-4 w-4' />
          <span className='hidden text-sm sm:inline'>Comments</span>
        </>
      }
    </button>,
    document.body,
  );
}

export default function NoteEditorComments(props: NoteEditorCommentsProps) {
  return <CommentToggleButton {...props} />;
}
