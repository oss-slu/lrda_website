import React from "react";
import { UploadIcon } from "lucide-react"; // Import UploadIcon for the publish button
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip"; // Import Tooltip components

// Define the type for your component's props
interface PublishToggleProps {
  id?: string; // Optional ID for the component
  isPublished: boolean;
  onPublishClick?: () => void; // Function to handle publish action when clicked
}

// Define the PublishToggle component
const PublishToggle: React.FC<PublishToggleProps> = ({ id, onPublishClick }) => {
  const handlePublishClick = () => {
    if (onPublishClick) {
      onPublishClick(); // Call the publish handler if provided
    }
  };

  return (
    <div
      id={id}
      className="flex flex-row items-center p-3 justify-between cursor-pointer group" // Add `group` class here
      onClick={handlePublishClick}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <UploadIcon className="h-6 w-6 text-black group-hover:text-green-500" /> {/* Icon turns green on hover */}
              <span className="font-semibold text-black group-hover:text-green-500">Publish</span> {/* Text turns green on hover */}
            </div>
          </TooltipTrigger>
          <TooltipContent className="flex flex-col justify-center items-center">
            <p>Publish your note.</p>
            <p>This will make your note publicly visible!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PublishToggle; // Export the component
