'use client';

import React from 'react';
import CommentSidebar from '../comments/CommentSidebar';
import type { Editor } from '@tiptap/core';

export function CommentSidebarPanel({
  noteId,
  editor,
  isInstructor,
  canComment,
  isOpen,
}: {
  noteId: string;
  editor: Editor | null;
  isInstructor: boolean;
  canComment: boolean;
  isOpen: boolean;
}) {
  const getCurrentSelection = () => {
    if (!editor) return null;
    const { from, to } = editor.state.selection;
    if (from === to) return null;
    return { from, to };
  };

  return (
    <div
      className={`shrink-0 overflow-hidden border-l border-gray-200 transition-[width] duration-200 ease-in-out ${
        isOpen ? 'w-[340px]' : 'w-0 border-l-0'
      }`}
    >
      <div className='h-full w-[340px]'>
        <CommentSidebar
          noteId={noteId}
          isInstructor={isInstructor}
          canComment={canComment}
          getCurrentSelection={getCurrentSelection}
        />
      </div>
    </div>
  );
}
