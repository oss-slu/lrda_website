import React from 'react'; //what if i just delete this file lol
import { VideoType } from '@/app/lib/models/media_class';
import { uploadMedia } from '@/app/lib/utils/s3_proxy';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { getVideoThumbnail, getVideoDuration } from '@/app/lib/utils/api_service';

type VideoPickerProps = {
  videoArray: VideoType[];
  setVideo?: React.Dispatch<React.SetStateAction<VideoType[]>>;
};

const VideoComponent: React.FC<VideoPickerProps> = ({ videoArray, setVideo }) => {
  // Unified upload handler for video files
  async function handleUnifiedUpload(file: File) {
    const fileType = file.type;

    // Validate the file type to ensure it's a video
    if (!fileType.startsWith('video/')) {
      toast('Error', { description: 'Please upload a valid video file.', duration: 4000 });
      return;
    }

    toast('Status Update', { description: 'Video upload in progress.', duration: 2000 });

    try {
      // Upload the video file
      const location = await uploadMedia(file, 'video');
      if (location === 'error') throw new Error('Video upload failed.');

      // Generate thumbnail for the video
      const thumbnailBlob = await getVideoThumbnail(file);
      const thumbnailLocation = await uploadMedia(thumbnailBlob as File, 'thumbnail');

      // Get the video's duration
      const duration = await getVideoDuration(file);

      // Handle failed thumbnail upload
      if (thumbnailLocation === 'error') throw new Error('Thumbnail upload failed.');

      // Create a new video object with all the uploaded details
      const newVideo = new VideoType({
        type: 'video',
        uuid: uuidv4(),
        uri: location, // Video URL
        thumbnail: thumbnailLocation, // Thumbnail URL
        duration: duration ? String(duration) : '0:00', // Ensure duration is a string
      });

      toast('Status Update', {
        description: "Video upload success! Don't forget to save!",
        duration: 4000,
      });

      // Update the videoArray state if setVideo is provided
      if (setVideo) {
        setVideo(prevVideos => [...prevVideos, newVideo]);
      }
    } catch (error) {
      console.error('Error processing video:', error);
      toast('Status Update', {
        description: 'Error processing video. Please try again later.',
        duration: 4000,
      });
    }
  }

  return null;
};

export default VideoComponent;
