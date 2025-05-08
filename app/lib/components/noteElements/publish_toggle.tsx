// PublishToggle.tsx
"use client";

import React, { useEffect, useState } from "react";
import { UploadIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";
import { User } from "../../models/user_class";

interface PublishToggleProps {
  id?: string;
  isApprovalRequested?: boolean;
  isPublished: boolean;
  noteId: string;
  userId: string | null;
  instructorId?: string | null;
  onPublishClick?: () => void;
  onRequestApprovalClick?: () => void;
}

const PublishToggle: React.FC<PublishToggleProps> = ({
  id,
  isPublished,
  isApprovalRequested = false,
  onPublishClick,
  onRequestApprovalClick,
}) => {
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    (async () => {
      const roles = await User.getInstance().getRoles();
      setIsStudent(!!roles?.contributor && !roles?.administrator);
    })();
  }, []);

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
      labelText = "Publish";
      tooltipText = "Publish this note.";
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            id={id}
            className="flex flex-row items-center p-3 justify-between cursor-pointer group"
            onClick={handlePublishClick}
          >
            <div className="flex items-center space-x-2">
              <UploadIcon className={`h-6 w-6 ${iconClass}`} />
              <span className={`font-semibold ${iconClass}`}>{labelText}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PublishToggle;
