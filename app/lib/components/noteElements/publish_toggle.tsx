import React, { useEffect, useRef, useState } from "react";
import { GlobeIcon } from "lucide-react"; // Import GlobeIcon component
import { Switch } from "@/components/ui/switch"; // Import Switch component
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip"; // Import Tooltip components

// Define the type for your component's props
interface PublishToggleProps {
  id?: string; // The optional `id` prop, can be passed to identify this component in the DOM
  isPublished: boolean; // The state indicating whether the note is published
  onPublishChange?: (isPublished: boolean) => void; // Function to handle changes when the publish state changes
}

// Define your component as a functional component with typed props
const PublishToggle: React.FC<PublishToggleProps> = ({
  id, // Destructure `id` from props
  isPublished,
  onPublishChange,
}) => {
  const [published, setPublished] = useState(isPublished); // Local state to manage the published status

  // Update the local state when the `isPublished` prop changes
  useEffect(() => {
    setPublished(isPublished);
  }, [isPublished]);

  // Function to handle the state change of publishing
  const handleIsPublishChange = () => {
    const newPublishedState = !published;
    console.log(newPublishedState); // Log the new published state for debugging
    setPublished(newPublishedState); // Update the local state
    if (onPublishChange) {
      onPublishChange(newPublishedState); // If a change handler is provided, call it with the new state
    }
  };

  // Render the component
  return (
    <div id={id} className="flex flex-row align-middle items-center px-4">
      {/* Add the id prop to the root div */}
      <GlobeIcon className="mr-2 align-middle" />
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger>
            {/* Switch component to toggle publish state */}
            <Switch
              className="align-middle"
              checked={published}
              onCheckedChange={handleIsPublishChange} // Toggle the state when changed
            />
          </TooltipTrigger>
          <TooltipContent className="flex flex-col justify-center items-center">
            <p>Switch to Publish note.</p>
            <p>This will allow the public to see your note!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PublishToggle; // Export the component