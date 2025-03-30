import React, { useState } from "react";
import { UploadIcon } from "lucide-react"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip";

interface PublishToggleProps {
  id?: string;
  isPublished: boolean;
  onPublishClick: () => Promise<void>; // Ensure async function
}

const PublishToggle: React.FC<PublishToggleProps> = ({ id, isPublished, onPublishClick }) => {
  const [showPublishNotification, setShowPublishNotification] = useState(false);

  const handlePublishClick = async () => {
    await onPublishClick(); // Ensure it updates state correctly
    setShowPublishNotification(true);
    setTimeout(() => setShowPublishNotification(false), 3000);
  };

  return (
    <div className="relative">
      {showPublishNotification && (
        <div className="absolute top-0 right-0 mt-4 mr-4 p-2 bg-green-500 text-white rounded shadow">
          {isPublished ? "Note published successfully!" : "Note unpublished!"}
        </div>
      )}

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
                    isPublished ? "text-green-500" : "text-black group-hover:text-green-500"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    isPublished ? "text-green-500" : "text-black group-hover:text-green-500"
                  }`}
                >
                  {isPublished ? "Unpublish" : "Publish"}
                </span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isPublished ? "Unpublish this note." : "Publish this note."}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PublishToggle;
