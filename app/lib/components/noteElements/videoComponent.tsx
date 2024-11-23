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
  // Unified upload handler for video files
  async function handleUnifiedUpload(file: File) {
    const fileType = file.type;

    // Validate the file type to ensure it's a video
    if (!fileType.startsWith("video/")) {
      toast("Error", { description: "Please upload a valid video file.", duration: 4000 });
      return;
    }

    toast("Status Update", { description: "Video upload in progress.", duration: 2000 });

    try {
      // Upload the video file
      const location = await uploadMedia(file, "video");
      if (location === "error") throw new Error("Video upload failed.");

      // Generate thumbnail for the video
      const thumbnailBlob = await getVideoThumbnail(file);
      const thumbnailLocation = await uploadMedia(thumbnailBlob as File, "thumbnail");

      // Get the video's duration
      const duration = await getVideoDuration(file);

      // Handle failed thumbnail upload
      if (thumbnailLocation === "error") throw new Error("Thumbnail upload failed.");

      // Create a new video object with all the uploaded details
      const newVideo = new VideoType({
        type: "video",
        uuid: uuidv4(),
        uri: location, // Video URL
        thumbnail: thumbnailLocation, // Thumbnail URL
        duration: duration ? String(duration) : "0:00", // Ensure duration is a string
      });

      toast("Status Update", {
        description: "Video upload success! Don't forget to save!",
        duration: 4000,
      });

      // Update the videoArray state if setVideo is provided
      if (setVideo) {
        setVideo((prevVideos) => [...prevVideos, newVideo]);
      }
    } catch (error) {
      console.error("Error processing video:", error);
      toast("Status Update", {
        description: "Error processing video. Please try again later.",
        duration: 4000,
      });
    }
  }

  return (
    <div className="flex flex-row items-center p-3 justify-between">
      {/* Dialog to display the list of videos */}
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

          {/* Render videos if present, otherwise display 'No Videos' */}
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

      {/* Upload button for video files */}
      <Popover>
        <PopoverTrigger asChild>
          <UploadIcon className="hover:text-green-500 cursor-pointer h-5 w-5 mx-2" />
        </PopoverTrigger>
        <PopoverContent className="z-30">
          <div className="flex p-4 flex-col justify-center items-center w-96 min-w-[90px] max-w-[280px] h-min bg-white shadow-lg rounded-md">
            <div className="px-4">Upload Videos Here.</div>
            <div className="px-4 mb-3">It must be of type '.mp4'</div>

            {/* File input for uploading videos */}
            <Input
              type="file"
              accept=".mp4" // Restrict file types to MP4 videos
              onChange={(e) => {
                const file = e.target.files?.[0]; // Get the selected file
                if (file) handleUnifiedUpload(file); // Pass the file to the unified upload handler
              }}
              data-testid="file-input"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VideoComponent;
