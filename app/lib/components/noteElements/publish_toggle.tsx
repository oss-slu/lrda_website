import React, { useEffect, useRef, useState } from "react";
import { GlobeIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";

interface PublishToggleProps {
  isPublished: boolean;
  onPublishChange?: (isPublished: boolean) => void;
}

export default function PublishToggle({
  isPublished,
  onPublishChange,
}: PublishToggleProps) {
  const [published, setPublished] = useState(isPublished);

  useEffect(() => {
    setPublished(isPublished);
  }, [isPublished]);

  const HandleIsPublishChange = () => {
    const newPublishedState = !published;
    console.log(newPublishedState);
    setPublished(newPublishedState);
    if (onPublishChange) {
      onPublishChange(newPublishedState);
    }
  };

  return (
    <div className="flex flex-row align-middle items-center px-4">
      <GlobeIcon className="mr-2 align-middle" />
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger>
            <Switch
            className="align-middle"
              checked={published}
              onCheckedChange={HandleIsPublishChange}
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
}
