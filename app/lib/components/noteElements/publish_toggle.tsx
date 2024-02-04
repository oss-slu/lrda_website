import React, { useEffect, useRef, useState } from "react";
import { GlobeIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  }
  

  return (
    <div className="flex flex-row align-middle items-center px-5">
      <GlobeIcon />
      <div className="w-1" />
      <Switch checked={published} onCheckedChange={HandleIsPublishChange} />
    </div>
  );
}
