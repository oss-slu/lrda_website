'use client';
import React from 'react';
import { UploadIcon, XCircle, ArrowDownToLine } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/tooltip';
import { useAuthStore } from '@/app/lib/stores/authStore';
import { hasInstructorAccess } from '@/app/lib/stores/authHelpers';
import { useShallow } from 'zustand/react/shallow';
import { statusConfig, type NoteStatus } from '@/app/lib/utils/noteStatus';

interface PublishToggleProps {
  id?: string;
  isApprovalRequested?: boolean;
  isPublished: boolean;
  isReturned?: boolean;
  noteId: string;
  userId: string | null;
  instructorId?: string | null;
  onPublishClick?: () => void;
  onRequestApprovalClick?: () => void;
  isInstructorReview?: boolean; // instructor viewing a student's note
}

const PublishToggle: React.FC<PublishToggleProps> = ({
  id,
  isPublished,
  isApprovalRequested = false,
  isReturned = false,
  onPublishClick,
  onRequestApprovalClick,
  isInstructorReview = false,
}) => {
  // Use auth store for user roles
  const { user: authUser } = useAuthStore(
    useShallow(state => ({
      user: state.user,
    })),
  );

  const isInstructor = hasInstructorAccess(authUser);
  const isStudent = !isInstructor;

  // Derive note status for the badge
  const noteStatus: NoteStatus =
    isPublished ? 'published'
    : isReturned ? 'returned'
    : isApprovalRequested ? 'pending'
    : 'draft';
  const badge = statusConfig[noteStatus];

  const handlePublishClick = () => {
    if (isStudent) {
      if (isPublished) {
        // student unpublishing their own published note
        if (onPublishClick) onPublishClick();
      } else {
        // student requesting or canceling approval
        if (onRequestApprovalClick) onRequestApprovalClick();
      }
    } else {
      // instructor/admin toggles publish
      if (onPublishClick) onPublishClick();
    }
  };

  let iconClass: string;
  let labelText: string;
  let tooltipText: string;
  let IconComponent: React.ElementType = UploadIcon;

  if (isStudent) {
    if (isPublished) {
      iconClass = 'text-red-500';
      labelText = 'Unpublish';
      tooltipText = 'Unpublish this note.';
      IconComponent = ArrowDownToLine;
    } else if (isApprovalRequested) {
      iconClass = 'text-yellow-500';
      labelText = 'Cancel Request';
      tooltipText = 'Cancel your approval request.';
      IconComponent = XCircle;
    } else {
      iconClass = 'text-blue-500';
      labelText = 'Request Approval';
      tooltipText = 'Request instructor approval to publish.';
    }
  } else {
    if (isPublished) {
      iconClass = 'text-red-500';
      labelText = 'Unpublish';
      tooltipText = 'Unpublish this note.';
      IconComponent = ArrowDownToLine;
    } else {
      iconClass = 'text-black group-hover:text-green-500';
      labelText = isInstructorReview ? 'Approve' : 'Publish';
      tooltipText = isInstructorReview ? 'Approve and publish this note.' : 'Publish this note.';
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
        {badge.label}
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              id={id}
              className='group inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
              onClick={handlePublishClick}
            >
              <IconComponent
                className={`h-4 w-4 ${iconClass}`}
              />
              <span
                className={iconClass}
              >
                {labelText}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PublishToggle;
