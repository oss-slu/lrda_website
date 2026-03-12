/**
 * Media Service
 *
 * Handles media-related operations including video thumbnail generation
 * and duration extraction.
 */

/**
 * Format duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted string (e.g., "1:23" or "1:02:30")
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(String(hours));
  }

  parts.push(hours > 0 && minutes < 10 ? `0${minutes}` : String(minutes));
  parts.push(secs < 10 ? `0${secs}` : String(secs));

  return parts.join(':');
}

/**
 * Generate a thumbnail image from a video file.
 * @param file - The video file
 * @param seekTo - Time in seconds to capture the thumbnail (default: 0)
 * @returns A Blob containing the JPEG thumbnail
 */
export async function getVideoThumbnail(file: File, seekTo = 0.0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.load();

    video.addEventListener('error', ex => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Error loading video: ${ex.message || ex.toString()}`));
    });

    video.addEventListener('loadedmetadata', () => {
      if (video.duration < seekTo) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Video is too short'));
        return;
      }

      setTimeout(() => {
        video.currentTime = seekTo;
      }, 200);
    });

    video.addEventListener('seeked', () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.canvas.toBlob(
        blob => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        'image/jpeg',
        0.75,
      );
    });
  });
}

/**
 * Get the duration of a video file.
 * @param file - The video file
 * @returns Formatted duration string (e.g., "1:23" or "1:02:30")
 */
export async function getVideoDuration(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(formatDuration(video.duration));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

export const mediaService = {
  getVideoThumbnail,
  getVideoDuration,
  formatDuration,
};
