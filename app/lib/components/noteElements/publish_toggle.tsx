import React, { useEffect, useState } from "react";
import { UploadIcon } from "lucide-react"; // Import UploadIcon for the publish button
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip"; // Import Tooltip components
import { User } from "../../models/user_class";
import { toast } from "@/components/ui/use-toast";

interface PublishToggleProps {
  id?: string; // Optional ID for the component
  isPublished: boolean;
  noteId: string;
  userId: string | null; // Accept string or null
  instructorId?: string | null; // Optional and can also be null
  onPublishClick?: () => void;
}


// Define the PublishToggle component
const PublishToggle: React.FC<PublishToggleProps> = ({ id, isPublished, onPublishClick }) => {
  const [isStudent, setIsStudent] = React.useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const roles = await User.getInstance().getRoles();
      setIsStudent(roles?.contributor && !roles?.administrator);
    };
    checkRole();
  }, []);

  const handlePublishClick = () => {
    if (isStudent) {
      toast("Approval Needed", {
        description: "Instructors must approve your note before publishing.",
        duration: 4000,
      });
    } else if (onPublishClick) {
      onPublishClick();
    }
  };

  return (
    <div>
      <div
        id={id}
        className="flex flex-row items-center p-3 justify-between cursor-pointer group"
        onClick={handlePublishClick}
      >
        <div className="flex items-center space-x-2">
          <UploadIcon
            className={`h-6 w-6 ${isPublished ? 'text-green-500' : 'text-black group-hover:text-green-500'}`}
          />
          <span
            className={`font-semibold ${isPublished ? 'text-green-500' : 'text-black group-hover:text-green-500'}`}
          >
            {isStudent ? "Request Approval" : "Publish"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PublishToggle; // Export the component
