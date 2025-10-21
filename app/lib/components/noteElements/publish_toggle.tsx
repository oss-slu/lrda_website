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
        <div className="absolute top-0 right-0 mt-4 mr-4 px-4 py-2 bg-green-500 text-white rounded shadow">
          {isPublished ? "Note published successfully!" : "Note unpublished!"}
        </div>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              id={id}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors group"
              onClick={handlePublishClick}
            >
              <UploadIcon
                className={`h-4 w-4 ${
                  isPublished ? "text-green-500" : "text-gray-700 group-hover:text-green-500"
                }`}
              />
              <span
                className={`${
                  isPublished ? "text-green-600" : "text-gray-700 group-hover:text-green-600"
                }`}
              >
                {isPublished ? "Unpublish" : "Publish"}
              </span>
            </button>
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
