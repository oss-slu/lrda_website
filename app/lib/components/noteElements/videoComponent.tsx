import React from "react";
import { VideoType } from "../../models/media_class";

type VideoPickerProps = {
  videoArray: VideoType[];
  setVideo?: React.Dispatch<React.SetStateAction<VideoType[]>>;
};

const VideoComponent: React.FC<VideoPickerProps> = ({ videoArray }) => {

  const playVideo = (videoUri: string) => {
    window.open(videoUri, '_blank');
  };

  return (
    <div className="flex flex-row items-center p-2 h-9 min-w-[90px] max-w-[280px] shadow-sm rounded-md border border-border bg-white justify-center">
      {videoArray.map((video, index) => (
        <div key={index} className="min-w-[90px] max-w-[280px] shadow-sm rounded-md border bg-white justify-center cursor-pointer" onClick={() => playVideo(video.getUri())}>
          <div className="w-full h-48 bg-black text-white flex items-center justify-center overflow-hidden rounded-t-md">
            {video.getThumbnail() ? (
              <img src={video.getThumbnail()} alt="Video thumbnail" className="w-full h-full object-cover" />
            ) : (
              <span>Play Video</span>
            )}
          </div>
          <div className="p-2 text-center">
            Video {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoComponent;
