import React from 'react';
import { Input } from '@/components/ui/input';

interface NoteEditorHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  isViewingStudentNote: boolean;
  titleRef: React.RefObject<HTMLInputElement | null>;
}

export default function NoteEditorHeader({
  title,
  onTitleChange,
  isViewingStudentNote,
  titleRef,
}: NoteEditorHeaderProps) {
  return (
    <Input
      id='note-title-input'
      value={title}
      onChange={e => onTitleChange(e.target.value)}
      placeholder='Untitled'
      disabled={isViewingStudentNote}
      readOnly={isViewingStudentNote}
      className={`border-0 bg-transparent p-0 text-3xl font-bold transition-all duration-200 ease-in-out placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 ${
        isViewingStudentNote ? 'cursor-default opacity-90' : ''
      }`}
      ref={titleRef}
    />
  );
}
