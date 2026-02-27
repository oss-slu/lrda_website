const S3_PROXY_PREFIX = process.env.NEXT_PUBLIC_S3_PROXY_PREFIX;

async function convertHeicToJpg(uri: string) {
  console.log('Converting HEIC to JPG...');
  const convertedImageUri = await performHeicToJpgConversion(uri);
  console.log('Converted image URI: ', convertedImageUri);
  return convertedImageUri;
}

async function performHeicToJpgConversion(uri: string) {
  return uri;
}

async function uploadMedia(file: File, mediaType: string): Promise<string> {
  const data = new FormData();
  const uniqueName = `media-${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
  data.append('file', file, uniqueName);

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

async function uploadAudio(file: File): Promise<string> {
  const data = new FormData();
  const uniqueName = `media-${Date.now()}.mp3`;
  data.append('file', file, uniqueName);

  const resp = await fetch(`${S3_PROXY_PREFIX}uploadFile`, {
    method: 'POST',
    mode: 'cors',
    body: data,
  });

  if (!resp.ok) {
    throw new Error(`Audio upload failed: ${resp.status}`);
  }

  const location = resp.headers.get('Location');
  if (!location) {
    throw new Error('No Location header in upload response');
  }

  return location;
}

export { convertHeicToJpg, uploadMedia, uploadAudio };
