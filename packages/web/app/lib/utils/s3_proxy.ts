const S3_PROXY_PREFIX = import.meta.env.VITE_S3_PROXY_PREFIX;

const EXTENSION_MAP: Record<string, string> = {
  image: 'jpg',
  video: 'mp4',
  audio: 'mp3',
};

async function uploadMedia(file: File, mediaType: 'image' | 'video' | 'audio'): Promise<string> {
  const ext = EXTENSION_MAP[mediaType];
  const data = new FormData();
  data.append('file', file, `media-${Date.now()}.${ext}`);

  const resp = await fetch(S3_PROXY_PREFIX + 'uploadFile', {
    method: 'POST',
    mode: 'cors',
    body: data,
  });

  if (!resp.ok) {
    throw new Error(`Media upload failed: ${resp.status}`);
  }

  const location = resp.headers.get('Location');
  if (!location) {
    throw new Error('No Location header in upload response');
  }

  return location;
}

export { uploadMedia };
