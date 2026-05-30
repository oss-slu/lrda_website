const S3_PROXY_PREFIX = import.meta.env.VITE_S3_PROXY_PREFIX;

const FALLBACK_EXT = {
  image: 'jpg',
  video: 'mp4',
  audio: 'mp3',
} as const;

function getExtension(file: File, mediaType: 'image' | 'video' | 'audio'): string {
  const mimeExt = file.type.split('/')[1]?.split(';')[0];
  if (mimeExt && mimeExt !== '*') return mimeExt;
  const parts = file.name.split('.');
  if (parts.length > 1) return parts.pop()!;
  return FALLBACK_EXT[mediaType];
}

async function uploadMedia(file: File, mediaType: 'image' | 'video' | 'audio'): Promise<string> {
  const ext = getExtension(file, mediaType);
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
