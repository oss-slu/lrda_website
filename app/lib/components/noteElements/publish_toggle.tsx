import React, { useState } from "react";
import { FileCheck2 } from "lucide-react"; // Import FileCheck2 for the publish button
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/tooltip"; // Import Tooltip components

// Define the type for your component's props
interface PublishToggleProps {
  id?: string; // Optional ID for the component
  isPublished: boolean;
  onPublishClick?: () => void; // Function to handle publish action when clicked
}

// Define the PublishToggle component
const PublishToggle: React.FC<PublishToggleProps> = ({ id, isPublished, onPublishClick }) => {
  const [showPublishNotification, setShowPublishNotification] = useState(false);

  const handlePublishClick = () => {
    if (onPublishClick) {
      onPublishClick(); // Call the publish handler if provided
    }
    setShowPublishNotification(true); // Show the publish notification
    setTimeout(() => setShowPublishNotification(false), 3000); // Hide the notification after 3 seconds
  };

  return (
    <div>
      {/* Publish Notification */}
      {showPublishNotification && (
        <div className="absolute top-0 right-0 mt-4 mr-4 p-2 bg-green-500 text-white rounded shadow">
          Note published successfully!
        </div>
      )}

      {/* Publish Button */}
      <div
        id={id}
        className="flex flex-row items-center px-16 h-12 justify-between cursor-pointer group"
        onClick={handlePublishClick}
      >
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <FileCheck2
                  className={`h-6 w-6 ${isPublished ? 'text-green-500' : 'text-black group-hover:text-green-500'}`}
                /> {/* Icon stays green if published */}
                <span
                  className={`font-semibold ${isPublished ? 'text-green-500' : 'text-black group-hover:text-green-500'}`}
                >
                  Publish
                </span> {/* Text stays green if published */}
              </div>
            </TooltipTrigger>
            <TooltipContent className="flex flex-col justify-center items-center">
              <p>Publish your note.</p>
              <p>This will make your note publicly visible!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default PublishToggle; // Export the component
