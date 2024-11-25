import React from "react"; //what if i just delete this file lol 
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
import { getVideoThumbnail, getVideoDuration } from "../../utils/api_service";

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

    try {
      const location = await uploadMedia(file, "video");
      if (location !== "error") {
        const thumbnailBlob = await getVideoThumbnail(file);
        console.log("Thumbnail blob", thumbnailBlob);
        const thumbnailLocation = await uploadMedia(
          thumbnailBlob as File,
          "thumbnail"
        );
        const duration = await getVideoDuration(file);
        console.log("Duration", duration);
        if (thumbnailLocation !== "error") {
          const newVideo = new VideoType({
            type: "video",
            uuid: uuidv4(),
            uri: location,
            thumbnail: thumbnailLocation,
            duration: (duration as string) || "0:00",
          });

          toast("Status Update", {
            description: "Video upload success! Don't forget to save!",
            duration: 4000,
          });

          if (setVideo) {
            setVideo((prevVideos) => [...prevVideos, newVideo]);
          }
        } else {
          console.error("Thumbnail upload failed");
          toast("Status Update", {
            description: "Thumbnail Upload Failed! Please try again later.",
            duration: 4000,
          });
        }
      } else {
        console.error("Video upload failed");
        toast("Status Update", {
          description: "Video Upload Failed! Please try again later.",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error processing video", error);
      toast("Status Update", {
        description: "Error processing video. Please try again later.",
        duration: 4000,
      });
    }
  }

  return (
    <div className="flex flex-row items-center p-3 justify-between">
      <Dialog>
        <DialogTrigger asChild>
          <div>
            <VideoIcon className="hover:text-green-500 cursor-pointer h-6 w-6 mx-2" />
          </div>
        </DialogTrigger>
        <DialogContent className="w-full sm:max-w-[70%] h-[100vh] px-20 overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl">Videos</DialogTitle>
            <div className="h-1 w-full bg-black bg-opacity-70 rounded-full" />
          </DialogHeader>

          {videoArray.length > 0 ? (
            <div className="flex flex-col items-center justify-center max-w-full h-full object-fit">
              <MediaViewer mediaArray={videoArray} />
            </div>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p>No Videos</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <div>Video</div>
      <Popover>
        <PopoverTrigger asChild>
          <UploadIcon className="hover:text-green-500 cursor-pointer h-5 w-5 mx-2" />
        </PopoverTrigger>
        <PopoverContent className="z-30">
          <div className="flex p-4 flex-col justify-center items-center w-96 min-w-[90px] max-w-[280px] h-min bg-white shadow-lg rounded-md">
            <div className="px-4">Upload Videos Here.</div>
            <div className="px-4 mb-3">It must be of type '.mp4'</div>
            <Input
              type="file"
              accept=".mp4"
              onChange={(e) => handleFileChange(e)}
              data-testid="file-input"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VideoComponent;
