"use client";
import React from "react";
import { UploadIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";
import { useAuthStore } from "../../../stores/authStore";
import { useShallow } from "zustand/react/shallow";

interface PublishToggleProps {
  id?: string;
  isApprovalRequested?: boolean;
  isPublished: boolean;
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
  onPublishClick,
  onRequestApprovalClick,
  isInstructorReview = false,
}) => {
  // Use auth store for user roles
  const { user: authUser } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
    }))
  );

  // Compute isStudent directly from authUser roles (no need for useState)
  const roles = authUser?.roles;
  const isStudent = !!roles?.contributor && !roles?.administrator;

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

  let iconClass, labelText, tooltipText;

  if (isStudent) {
    if (isPublished) {
      iconClass = "text-green-500";
      labelText = "Published";
      tooltipText = "Click to unpublish.";
    } else if (isApprovalRequested) {
      iconClass = "text-yellow-500";
      labelText = "Cancel Approval Request";
      tooltipText = "Cancel your approval request.";
    } else {
      iconClass = "text-blue-500";
      labelText = "Request Approval";
      tooltipText = "Request instructor approval to publish.";
    }
  } else {
    if (isPublished) {
      iconClass = "text-green-500";
      labelText = "Unpublish";
      tooltipText = "Unpublish this note.";
    } else {
      iconClass = "text-black group-hover:text-green-500";
      labelText = isInstructorReview ? "Approve" : "Publish";
      tooltipText = isInstructorReview ? "Approve and publish this note." : "Publish this note.";
    }
  }

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              id={id}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors group"
              onClick={handlePublishClick}
            >
              <UploadIcon className={`h-4 w-4 ${isPublished ? "text-green-500" : "text-gray-700 group-hover:text-green-500"}`} />
              <span className={`${isPublished ? "text-green-600" : "text-gray-700 group-hover:text-green-600"}`}>{labelText}</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PublishToggle;
