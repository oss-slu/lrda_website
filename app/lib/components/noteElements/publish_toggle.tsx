import React, { useEffect, useState } from "react";
import { UploadIcon } from "lucide-react"; // Import UploadIcon for the publish button
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip"; // Import Tooltip components
import { User } from "../../models/user_class";
import { toast } from "@/components/ui/use-toast";

interface PublishToggleProps {
  id?: string; // Optional ID for the component
  isApprovalRequested?: boolean; // Optional prop to indicate if approval is requested
  isPublished: boolean;
  noteId: string;
  userId: string | null; // Accept string or null
  instructorId?: string | null; // Optional and can also be null
  onPublishClick?: () => void;
  onRequestApprovalClick?: () => void;
}


// Define the PublishToggle component
const PublishToggle: React.FC<PublishToggleProps> = ({ id, isPublished, onPublishClick, isApprovalRequested, onRequestApprovalClick }) => {
  const [isStudent, setIsStudent] = React.useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const roles = await User.getInstance().getRoles();
      setIsStudent(!!roles?.contributor && !roles?.administrator);
    };
    checkRole();
  }, []);

  const handlePublishClick = () => {
    if (isStudent) {
      if (onRequestApprovalClick) {
        console.log("Student role detected. Triggering onRequestApprovalClick.");
        onRequestApprovalClick();
      } else {
        console.log("No onRequestApprovalClick handler provided.");
      }
    } else if (onPublishClick) {
      console.log("Admin/Instructor toggling publish state.");
      onPublishClick();
    }
  };

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
              <UploadIcon
                className={`h-6 w-6 ${
                  isStudent
                    ? isApprovalRequested
                      ? "text-yellow-500"
                      : "text-blue-500"
                    : isPublished
                    ? "text-green-500"
                    : "text-black group-hover:text-green-500"
                }`}
              />
             <span
  className={`font-semibold ${
    isStudent
      ? isApprovalRequested
        ? "text-yellow-500" // Yellow for "Cancel Approval"
        : "text-blue-500" // Blue for "Request Approval"
      : isPublished
      ? "text-green-500" // Green for "Unpublish"
      : "text-black group-hover:text-green-500" // Black for "Publish"
  }`}
>
  {isStudent
    ? isApprovalRequested
      ? "Cancel Approval Request" // When approvalRequested is true
      : "Request Approval" // When approvalRequested is false
    : isPublished
    ? "Unpublish"
    : "Publish"}
</span>

            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isStudent
            ? isApprovalRequested
              ? "Cancel your approval request."
              : "Request instructor approval to publish this note."
            : isPublished
            ? "Unpublish this note."
            : "Publish this note."}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PublishToggle;