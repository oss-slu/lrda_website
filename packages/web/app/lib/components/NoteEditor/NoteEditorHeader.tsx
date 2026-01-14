"use client";

import React, { forwardRef, RefObject } from "react";
import { Input } from "@/components/ui/input";
import { FileX2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PublishToggle from "./NoteElements/PublishToggle";
import { handleTitleChange } from "./handlers/noteHandlers";
import type { NoteStateType, NoteHandlersType } from "./hooks/useNoteState";

interface NoteEditorHeaderProps {
  noteState: NoteStateType;
  noteHandlers: NoteHandlersType;
  isSaving: boolean;
  isViewingStudentNote: boolean;
  userId: string | null;
  instructorId: string | null;
  onPublishClick: () => void;
  onRequestApprovalClick: () => void;
  onDeleteNote: () => Promise<boolean>;
  onNoteDeleted?: () => void;
  onTitleChange: () => void;
  titleRef: RefObject<HTMLInputElement | null>;
  deleteRef: RefObject<HTMLButtonElement | null>;
}

const NoteEditorHeader = forwardRef<HTMLDivElement, NoteEditorHeaderProps>(
  (
    {
      noteState,
      noteHandlers,
      isSaving,
      isViewingStudentNote,
      userId,
      instructorId,
      onPublishClick,
      onRequestApprovalClick,
      onDeleteNote,
      onNoteDeleted,
      onTitleChange,
      titleRef,
      deleteRef,
    },
    ref
  ) => {
    return (
      <div ref={ref} className="flex flex-col">
        <Input
          id="note-title-input"
          value={noteState.title}
          onChange={(e) => {
            onTitleChange();
            handleTitleChange(noteHandlers.setTitle, e);
          }}
          placeholder="Untitled"
          disabled={isViewingStudentNote}
          readOnly={isViewingStudentNote}
          className={`border-0 p-0 font-bold text-3xl bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 transition-all duration-200 ease-in-out ${
            isViewingStudentNote ? "cursor-default opacity-90" : ""
          }`}
          ref={titleRef}
        />
        <div className="flex flex-row items-center gap-4 mt-6 pb-4 border-b border-gray-200">
          {/* Auto-save indicator */}
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="w-12">Saving...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="w-12">Saved</span>
              </>
            )}
          </div>

          <PublishToggle
            id="publish-toggle-button"
            isPublished={Boolean(noteState.isPublished)}
            isApprovalRequested={noteState.approvalRequested || false}
            noteId={noteState.note?.id || ""}
            userId={userId}
            instructorId={instructorId}
            onPublishClick={onPublishClick}
            onRequestApprovalClick={onRequestApprovalClick}
            isInstructorReview={isViewingStudentNote}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={!noteState.note?.id || isSaving || isViewingStudentNote}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  isViewingStudentNote
                    ? "Cannot delete student notes"
                    : !noteState.note?.id
                    ? "Please wait for note to save before deleting"
                    : "Delete this note"
                }
                ref={deleteRef}
              >
                <FileX2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone. This will permanently delete this note.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const success = await onDeleteNote();
                    if (success && onNoteDeleted) {
                      onNoteDeleted();
                    }
                  }}
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  }
);

NoteEditorHeader.displayName = "NoteEditorHeader";

export default NoteEditorHeader;
