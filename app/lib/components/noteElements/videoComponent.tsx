import React from "react";
import { VideoType } from "../../models/media_class";
import { UploadIcon, VideoIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { uploadMedia } from "../../utils/s3_proxy";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import MediaViewer from "../media_viewer";

type VideoPickerProps = {
  videoArray: VideoType[];
  setVideo?: React.Dispatch<React.SetStateAction<VideoType[]>>;
};

const VideoComponent: React.FC<VideoPickerProps> = ({
  videoArray,
  setVideo,
}) => {
  async function handleFileChange(event: any) {
    toast("Status Update", {
      description: "Video upload in progress.",
      duration: 2000,
    });

    const file = event.target.files[0];
    const location = await uploadMedia(file, "video");
    if (location != "error") {
      const newVideo = new VideoType({
        type: "audio",
        uuid: uuidv4(),
        uri: location,
        thumbnail: "", // Get thumbnail from the uploaded video and add it here
        duration: "0:00",
      });

      toast("Status Update", {
        description: "Audio upload success!",
        duration: 4000,
      });

      if (setVideo) {
        setVideo([...videoArray, newVideo]);
      }
    } else {
      console.log("UPLOAD FAILED");
      toast("Status Update", {
        description: "Audio Upload Failed! Please try again later.",
        duration: 4000,
      });
    }
  }

  return (
    <div className="flex flex-row items-center p-2 h-9 min-w-[90px] max-w-[280px] shadow-sm rounded-md border border-border bg-white justify-between">
      <Popover>
        <PopoverTrigger asChild>
          <UploadIcon className="primary cursor-pointer" />
        </PopoverTrigger>
        <PopoverContent className="z-30">
          <div className="flex p-4 flex-col justify-center items-center w-96 min-w-[90px] max-w-[280px] h-min bg-white shadow-lg rounded-md">
            <div className="px-4">Upload Videos Here.</div>
            <div className="px-4 mb-3">It must be of type '.mp4'</div>
            <Input
              type="file"
              accept=".mp4"
              onChange={(e) => handleFileChange(e)}
            />
          </div>
        </PopoverContent>
      </Popover>

      <Dialog>
        <DialogTrigger asChild>
          <span className="cursor-pointer">Videos</span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[80%] h-[100vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl">Videos</DialogTitle>

            <div className="h-1 w-[100%] bg-black bg-opacity-70 rounded-full" />
          </DialogHeader>

          <MediaViewer mediaArray={videoArray} />

        </DialogContent>
      </Dialog>

      <VideoIcon />
    </div>
  );
};

export default VideoComponent;
